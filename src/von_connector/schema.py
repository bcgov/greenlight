import json
import os

import requests

from django.conf import settings

from .agent import Issuer, Holder, Verifier
from von_agent.util import encode

from . import eventloop
from . import helpers

import logging
logger = logging.getLogger(__name__)

TOB_BASE_URL = os.getenv('THE_ORG_BOOK_BASE_URL')


def claim_value_pair(plain):
    return [str(plain), encode(plain)]


class SchemaManager():

    claim_def_json = None

    def __init__(self):
        self.issuer = Issuer()
        self.holder = Holder()
        self.verifier = Verifier()
        schemas_path = os.path.abspath(settings.BASE_DIR + '/schemas.json')
        try:
            with open(schemas_path, 'r') as schemas_file:
                schemas_json = schemas_file.read()
        except FileNotFoundError as e:
            logger.error('Could not find schemas.json. Exiting.')
            raise
        self.schemas = json.loads(schemas_json)

    def publish_schema(self, schema):
        # Check if schema exists on ledger
        schema_json = eventloop.do(self.issuer.get_schema(
            self.issuer.did, schema['name'], schema['version']))

        # If not, send the schema to the ledger, then get result
        if not json.loads(schema_json):
            eventloop.do(self.issuer.send_schema(json.dumps(schema)))
            schema_json = eventloop.do(self.issuer.get_schema(
                self.issuer.did, schema['name'], schema['version']))

        schema = json.loads(schema_json)

        # Check if claim definition has been published. If not then publish.
        claim_def_json = eventloop.do(self.issuer.get_claim_def(
            schema['seqNo'], self.issuer.did))
        if not json.loads(claim_def_json):
            eventloop.do(self.issuer.send_claim_def(schema_json))

    def submit_claim(self, schema, claim):

        logger.debug('\n\nclaim:\n\n' + json.dumps(claim))
        logger.debug('\n\nschema:\n\n' + json.dumps(schema))

        for key, value in claim.items():
            claim[key] = claim_value_pair(value) if value else \
                claim_value_pair("")

        # We need schema from ledger
        schema_json = eventloop.do(self.issuer.get_schema(
            self.issuer.did, schema['name'], schema['version']))
        schema = json.loads(schema_json)

        logger.debug('\n\nschema:\n\n' + json.dumps(schema))

        claim_def_json = eventloop.do(self.issuer.get_claim_def(
            schema['seqNo'], self.issuer.did))

        response = requests.post(
            TOB_BASE_URL + '/bcovrin/generate-claim-request',
            json={
                'did': self.issuer.did,
                'seqNo': schema['seqNo'],
                'claim_def': claim_def_json
            }
        )

        # Build claim
        claim_request_json = response.json()
        (_, claim_json) = eventloop.do(self.issuer.create_claim(
            json.dumps(claim_request_json), claim))

        # Send claim
        response = requests.post(
            TOB_BASE_URL + '/bcovrin/store-claim',
            json={
                'claim_type': schema['data']['name'],
                'claim_data': json.loads(claim_json)
            }
        )

        return json.loads(claim_json)

    def verify_dba(self, data):
        # We need schema from ledger
        inc_schema_json = eventloop.do(self.holder.get_schema(
            self.issuer.did,
            'incorporation.bc_registries',
            '1.0.16'
        ))
        inc_schema = json.loads(inc_schema_json)

        dba_schema_json = eventloop.do(self.holder.get_schema(
            self.issuer.did,
            'doing_business_as.bc_registries',
            '1.0.16'
        ))
        dba_schema = json.loads(dba_schema_json)

        # now = helpers.now()

        # logger.info('\n\n\n\n\n\nnow\n' + str(now))

        proof_request = {
            'nonce': '1234',
            'name': 'proof_req_0',
            'version': '0',
            'requested_attrs': {
                'legal_entity_id': {
                    'schema_seq_no': inc_schema['seqNo'],
                    'name': 'legal_entity_id'
                },
                'doing_business_as_name': {
                    'schema_seq_no': dba_schema['seqNo'],
                    'name': 'doing_business_as_name'
                }
            },
            'requested_predicates': {
                #
                # Currently, there is no way to filter on schema
                # so claims with invalid values are evaluated and it
                # complains. Need to update to latest version of indy
                # sdk in order to add restrictions
                #
                # 'effective_date': {
                #     'attr_name': 'effective_date',
                #     'p_type': 'GE',
                #     'value': now
                # }
            }
        }

        logger.info('\n\n\n\n\n\nproof_request\n' + json.dumps(proof_request))

        claims_full = eventloop.do(self.holder.get_claims(json.dumps(proof_request)))
        claims = json.loads(claims_full[1])


        logger.info('\n\n\n\n\nclaims_full\n' + str(claims_full))
        logger.info('\n\n\n\n\n\nclaims[1]\n' + json.dumps(claims))

        if len(claims["attrs"]["doing_business_as_name"]) == 0 or len(claims["attrs"]["legal_entity_id"]) == 0:
            return (False, "Requested claim does not exist")

        def get_claim_by_attr(clms, key, value):
            for clm in clms:
                if clm["attrs"][key] == value:
                    return clm
            raise Exception

        try:
            requested_claims = {
                'self_attested_attributes': {},
                'requested_attrs': {
                    attr: [get_claim_by_attr(claims["attrs"][attr], attr, data[attr])["claim_uuid"], True]
                    for attr in claims["attrs"]
                },
                'requested_predicates': {}
            }
        except Exception:
            return (False, "Could not find attribute in claim")

        logger.info('\n\n\n\n\n\nrequested_claims\n' + json.dumps(requested_claims))

        def get_schema_by_seq_no(seq_no):
            for schema in (inc_schema, dba_schema):
                if schema['seqNo'] == seq_no:
                    return schema
            return None

        schemas = {
            claims["attrs"][attr][0]['claim_uuid']: get_schema_by_seq_no(claims["attrs"][attr][0]["schema_seq_no"])
            for attr in claims["attrs"]
        }

        logger.info('\n\n\n\n\n\nschemas_json\n' + json.dumps(schemas))        

        claim_defs = {
            claims["attrs"][attr][0]['claim_uuid']: json.loads(eventloop.do(
                self.holder.get_claim_def(
                    claims["attrs"][attr][0]["schema_seq_no"],
                    self.issuer.did
                )
            ))
            for attr in claims["attrs"]
        }

        logger.info('\n\n\n\n\nclaim_defs_json\n' + json.dumps(claim_defs))

        proof = eventloop.do(
            self.holder.create_proof(
                json.dumps(proof_request),
                json.dumps(schemas),
                json.dumps(claim_defs),
                requested_claims
            )
        )

        logger.info('\n\n\n\n\nproof\n' + proof)

        verified = eventloop.do(self.verifier.verify_proof(
            json.dumps(proof_request),
            json.loads(proof),
            json.dumps(schemas),
            json.dumps(claim_defs),
        ))

        logger.info('\n\n\n\n\nverified\n' + verified)

        return (verified, "Successfully verified")
