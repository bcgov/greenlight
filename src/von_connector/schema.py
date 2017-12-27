import json
import os

import requests

from django.conf import settings

from .agent import Issuer, Holder
from von_agent.util import encode

from . import eventloop

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


        # For now, we store claims every 

        # Check if claim definition has been published. If not then publish.
        claim_def_json = eventloop.do(self.issuer.get_claim_def(
            schema['seqNo'], self.issuer.did))
        if not json.loads(claim_def_json):
            eventloop.do(self.issuer.send_claim_def(schema_json))

    def submit_claim(self, schema, claim):
        for key, value in claim.items():
            claim[key] = claim_value_pair(str(value))

        # We need schema from ledger
        schema_json = eventloop.do(self.issuer.get_schema(
            self.issuer.did, schema['name'], schema['version']))
        schema = json.loads(schema_json)

        logger.info('\n\n\n\n\n\n\n\n\n\n\n0.\n\n\n\n\n\n\n\n\n\n\n')

        claim_def_json = eventloop.do(self.issuer.get_claim_def(
            schema['seqNo'], self.issuer.did))

        #
        #
        # Store claims in TheOrgBook.
        # Works, but TOB needs to be updated to accept
        # new request format:
        #
        # current:
        # <claim_json>
        #
        # new:
        # { "claim_type": <schema.name>, claim_data: <claim_json> }
        #

        # response = requests.post(
        #     TOB_BASE_URL + '/bcovrin/generate-claim-request',
        #     json={
        #         'did': self.issuer.did,
        #         'seqNo': schema['seqNo'],
        #         'claim_def': claim_def_json
        #     }
        # )

        # # Build claim
        # claim_request_json = response.json()
        # (_, claim_json) = eventloop.do(self.issuer.create_claim(
        #     json.dumps(claim_request_json), claim))

        # # Send claim
        # response = requests.post(
        #     TOB_BASE_URL + '/bcovrin/store-claim',
        #     json=json.loads({
        #         'claim_type': schema['name'],
        #         'claim_data': claim_json}
        #     )
        # )

        # Testing with local holder instance for now:

        logger.info('\n\n\n\n\n\n\n\n\n\n\n1.\n\n\n\n\n\n\n\n\n\n\n')

        eventloop.do(self.holder.store_claim_offer(
            self.issuer.did, schema['seqNo']))

        logger.info('\n\n\n\n\n\n\n\n\n\n\n2.\n\n\n\n\n\n\n\n\n\n\n')
        claim_request = eventloop.do(self.holder.store_claim_req(
            self.issuer.did, claim_def_json))

        logger.info('\n\n\n\n\n\n\n\n\n\n\n3.\n\n\n\n\n\n\n\n\n\n\n')

        logger.info('\n\n\n\n\n\n\n\n\n\n\nclaim_request:\n' + claim_request + '\n\n\n\n\n\n\n\n\n\n\n')
        logger.info('\n\n\n\n\n\n\n\n\n\n\nclaim:\n' + json.dumps(claim) + '\n\n\n\n\n\n\n\n\n\n\n')

        # Build claim
        (_, claim_json) = eventloop.do(self.issuer.create_claim(
            claim_request, claim))

        logger.info('\n\n\n\n\n\n\n\n\n\n\n4.\n\n\n\n\n\n\n\n\n\n\n')
        eventloop.do(self.holder.store_claim(claim_json))

        proof_request = {
            'nonce': '1234',
            'name': 'proof_req_0',
            'version': '0',
            'requested_attrs': {
                '{}_uuid'.format(attr): {
                    'schema_seq_no': schema['seqNo'],
                    'name': attr
                } for attr in claim
            },
            'requested_predicates': {
            }
        }


        logger.info('\n\n\n\n\n\nproof_request\n' + json.dumps(proof_request))


        claims = eventloop.do(self.holder.get_claims(json.dumps(proof_request)))








