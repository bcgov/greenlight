import json

from von_agent.nodepool import NodePool
from von_agent.demo_agents import TrustAnchorAgent, BCRegistrarAgent

from . import eventloop

import logging
logger = logging.getLogger(__name__)


class SchemaManager():

    pool = None
    trust_anchor = None
    bcreg_agent = None
    claim_def_json = None

    def __init__(self):
        self.pool = NodePool(
            'nodepool',
            '/app/.genesis')
        eventloop.do(self.pool.open())

        self.trust_anchor = TrustAnchorAgent(
            self.pool,
            '000000000000000000000000Trustee1',
            'trustee_wallet',
            None,
            '127.0.0.1',
            9700,
            'api/v0')
        eventloop.do(self.trust_anchor.open())

        self.bcreg_agent = BCRegistrarAgent(
            self.pool,
            'BC-Registrar-Agent-0000000000000',
            'bc-registrar-agent-wallet',
            None,
            '127.0.0.1',
            9703,
            'api/v0')

        logger.info('opening pool...\n\n')
        eventloop.do(self.bcreg_agent.open())
        logger.info('pool opened...\n\n')

    def publish_schema(self, schema):
        # Check if schema exists on ledger
        schema_json = eventloop.do(self.trust_anchor.get_schema(
            self.trust_anchor.did, schema['name'], schema['version']))

        # If not, send the schema to the ledger, then get result
        if not json.loads(schema_json):
            eventloop.do(self.trust_anchor.send_schema(json.dumps(schema)))
            schema_json = eventloop.do(self.trust_anchor.get_schema(
                self.trust_anchor.did, schema['name'], schema['version']))

        schema = json.loads(schema_json)

        # Check if claim definition has been published. If not then publish.
        claim_def_json = eventloop.do(self.bcreg_agent.get_claim_def(
            schema['seqNo'], self.bcreg_agent.did))
        if not json.loads(claim_def_json):
            eventloop.do(self.bcreg_agent.send_claim_def(schema_json))

    def submit_claim(self, schema):
        claim_def_json = eventloop.do(self.bcreg_agent.get_claim_def(
            schema['seqNo'], self.bcreg_agent.did))
        # TODO: Communicate with TOB

        # TODO: Generate claim
