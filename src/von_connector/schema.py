import json
import os

import requests

from django.conf import settings

from .agent import Issuer
from von_agent.util import encode

from . import eventloop

import logging
logger = logging.getLogger(__name__)

TOB_BASE_URL = os.getenv('THE_ORG_BOOK_API_URL')


def claim_value_pair(plain):
    return [str(plain), encode(plain)]


class SchemaManager():

    claim_def_json = None

    def __init__(self):
        schemas_path = os.path.abspath(settings.BASE_DIR + '/schemas.json')
        try:
            with open(schemas_path, 'r') as schemas_file:
                schemas_json = schemas_file.read()
        except FileNotFoundError as e:
            logger.error('Could not find schemas.json. Exiting.')
            raise
        self.schemas = json.loads(schemas_json)

        if os.getenv('PYTHON_ENV') == 'development':
            for schema in self.schemas:
                schema['version'] = '0.0.3'

    def __log_json(self, heading, data):
        logger.debug(
            "\n============================================================================\n" +
            "{0}\n".format(heading) +
            "----------------------------------------------------------------------------\n" +
            "{0}\n".format(json.dumps(data, indent=2)) +
            "============================================================================\n")
        return

    def publish_schema(self, schema):
        async def run(schema):
            async with Issuer() as issuer:
                # Check if schema exists on ledger
                schema_json = await issuer.get_schema(
                    issuer.did, schema['name'], schema['version'])

                # If not, send the schema to the ledger, then get result
                if not json.loads(schema_json):
                    await issuer.send_schema(json.dumps(schema))
                    schema_json = await issuer.get_schema(
                        issuer.did, schema['name'], schema['version'])

                schema = json.loads(schema_json)

                # Check if claim definition has been published.
                # If not then publish.
                claim_def_json = await issuer.get_claim_def(
                    schema['seqNo'], issuer.did)
                if not json.loads(claim_def_json):
                    await issuer.send_claim_def(schema_json)

        return eventloop.do(run(schema))

    def submit_claim(self, schema, claim):
        async def run(schema, claim):
            async with Issuer() as issuer:
                for key, value in claim.items():
                    claim[key] = claim_value_pair(value) if value else \
                        claim_value_pair("")

                self.__log_json('Claim:', claim)
                self.__log_json('Schema:', schema)

                # We need schema from ledger
                schema_json = await issuer.get_schema(
                    issuer.did, schema['name'], schema['version'])
                schema = json.loads(schema_json)

                self.__log_json('Schema:', schema)

                claim_def_json = await issuer.get_claim_def(
                    schema['seqNo'], issuer.did)

                self.__log_json('Requesting Claim Request:', 
                    {
                        'did': issuer.did,
                        'seqNo': schema['seqNo'],
                        'claim_def': json.loads(claim_def_json)
                    })

                response = requests.post(
                    TOB_BASE_URL + '/bcovrin/generate-claim-request',
                    json={
                        'did': issuer.did,
                        'seqNo': schema['seqNo'],
                        'claim_def': claim_def_json
                    }
                )

                # Build claim
                claim_request = response.json()

                claim_request_json = json.dumps(claim_request)
                self.__log_json('Claim Request Json:', claim_request)

                (_, claim_json) = await issuer.create_claim(
                    claim_request_json, claim)

                self.__log_json('Claim Json:', json.loads(claim_json))

                # Send claim
                response = requests.post(
                    TOB_BASE_URL + '/bcovrin/store-claim',
                    json={
                        'claim_type': schema['data']['name'],
                        'claim_data': json.loads(claim_json)
                    }
                )

                return response.json()

        return eventloop.do(run(schema, claim))
