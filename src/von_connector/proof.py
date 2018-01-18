import json
import os

import requests

from django.conf import settings

from .agent import Verifier
from von_agent.util import encode

from . import eventloop
from . import helpers

import logging
logger = logging.getLogger(__name__)

TOB_BASE_URL = os.getenv('THE_ORG_BOOK_BASE_URL')


class ProofRequestManager():

    claim_def_json = None

    def __init__(self):
        proof_request_path = os.path.abspath(
            settings.BASE_DIR + '/proof_request.json')
        try:
            with open(proof_request_path, 'r') as proof_request_file:
                proof_request_json = proof_request_file.read()
        except FileNotFoundError as e:
            logger.error('Could not find proof_request.json. Exiting.')
            raise

        logger.info(proof_request_json)
        self.proof_request = json.loads(proof_request_json)

    def request_proof(self, filters):
        async def run(filters):
            async with Verifier() as verifier:
                response = requests.post(
                    TOB_BASE_URL + '/bcovrin/construct-proof',
                    json={
                        'filters': filters,
                        'proof_request': self.proof_request
                    }
                )

                if response.status_code == 406:
                    return {
                        'success': False,
                        'error': response.json()['detail']
                    }

                proof_response = response.json()
                proof = proof_response['proof']

                parsed_proof = {}
                for attr in proof['requested_proof']['revealed_attrs']:
                    parsed_proof[attr] = \
                        proof['requested_proof']['revealed_attrs'][attr][1]

                verified = await verifier.verify_proof(
                    json.dumps(self.proof_request),
                    proof,
                    json.dumps(proof_response['schemas']),
                    json.dumps(proof_response['claim_defs']),
                )

                return {
                    'success': True,
                    'proof': proof,
                    'parsed_proof': parsed_proof,
                    'verified': verified
                }

        eventloop.do(run(filters))
