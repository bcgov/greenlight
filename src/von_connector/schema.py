import json

from .agent import Agent
from . import eventloop

import logging
logger = logging.getLogger(__name__)


class SchemaManager():

    claim_def_json = None

    def __init__(self):
        self.agent = Agent()

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

    def submit_claim(self, schema):
        claim_def_json = eventloop.do(self.bcreg_agent.get_claim_def(
            schema['seqNo'], self.bcreg_agent.did))
        # TODO: Communicate with TOB

        # TODO: Generate claim
