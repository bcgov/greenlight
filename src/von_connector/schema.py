import json
import os

import requests

from django.conf import settings

from .agent import Agent
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
        self.agent = Agent()
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
        schema_json = eventloop.do(self.agent.get_schema(
            self.agent.did, schema['name'], schema['version']))

        # If not, send the schema to the ledger, then get result
        if not json.loads(schema_json):
            eventloop.do(self.agent.send_schema(json.dumps(schema)))
            schema_json = eventloop.do(self.agent.get_schema(
                self.agent.did, schema['name'], schema['version']))

        schema = json.loads(schema_json)

        # Check if claim definition has been published. If not then publish.
        claim_def_json = eventloop.do(self.agent.get_claim_def(
            schema['seqNo'], self.agent.did))
        if not json.loads(claim_def_json):
            eventloop.do(self.agent.send_claim_def(schema_json))

    def submit_claim(self, schema, claim):
        for key, value in claim.items():
            claim[key] = claim_value_pair(value)

        # We need schema from ledger
        schema_json = eventloop.do(self.agent.get_schema(
            self.agent.did, schema['name'], schema['version']))
        schema = json.loads(schema_json)

        claim_def_json = eventloop.do(self.agent.get_claim_def(
            schema['seqNo'], self.agent.did))

        response = requests.post(
            TOB_BASE_URL + '/bcovrin/generate-claim-request',
            json={
                'did': self.agent.did,
                'seqNo': schema['seqNo'],
                'claim_def': claim_def_json
            }
        )

        logger.info('\n\n\n')
        logger.info(str(response.json()))
        logger.info('\n\n\n')

        # Build claim
        claim_request_json = response.json()
        (_, claim_json) = eventloop.do(self.agent.create_claim(
            json.dumps(claim_request_json), claim))

        response = requests.post(
            TOB_BASE_URL + '/bcovrin/store-claim',
            json=json.loads(claim_json)
        )
