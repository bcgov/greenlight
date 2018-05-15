import json
from datetime import datetime
import os

import requests

from .schema import SchemaManager
from .config import Configurator
from .agent import Issuer
from .agent import convert_seed_to_did
from . import eventloop

from django.apps import AppConfig

import logging
logger = logging.getLogger(__name__)

# TODO fix this global variable, badly implemented :-(
remote_wallet_token = None
tob_did = None

def get_tob_did():
    return tob_did

def get_remote_wallet_token():
    return remote_wallet_token

def wallet_auth():
    async def run():
        # If wallet type is "remote" then login to get  token
        WALLET_TYPE = os.environ.get('INDY_WALLET_TYPE')
        if WALLET_TYPE == 'remote':
            WALLET_USER_ID = os.environ.get('WALLET_USER_ID', 'wall-e')
            WALLET_PASSWORD = os.environ.get('WALLET_PASSWORD', 'pass1234')
            WALLET_BASE_URL = os.environ.get('INDY_WALLET_URL')
            logger.debug("Wallet URL: " + WALLET_BASE_URL)

            try:
                my_url = WALLET_BASE_URL + "api-token-auth/"
                response = requests.post(
                    my_url, data={"username": WALLET_USER_ID, "password": WALLET_PASSWORD})
                json_data = response.json()
                remote_token = json_data["token"]
                logger.debug(
                    "Authenticated remote wallet server: " + remote_token)
            except:
                raise Exception(
                    'Could not login to wallet. '
                    'Is the Wallet Service running?')
        else:
            remote_token = None

        return remote_token

    # TODO fix must be a better way
    global remote_wallet_token
    remote_wallet_token = eventloop.do(run())


class VonConnectorConfig(AppConfig):
    name = 'von_connector'

    def ready(self):
        logger.error("startup code ...")
        wallet_auth()
        TOB_INDY_SEED = os.getenv('TOB_INDY_SEED')
        config = Configurator().config
        now = datetime.now().strftime("%Y-%m-%d")
        # Register myself with TheOrgBook
        tob_base_url = os.getenv('THE_ORG_BOOK_API_URL')
        app_url = os.getenv('APPLICATION_URL')
        issuer_service_id = None

        async def run():
            logger.debug("running in run ...")
            async with Issuer() as agent:
                logger.debug("running with Issuer() ...")
                issuer_service_id = None

                global tob_did
                tob_did = await convert_seed_to_did(TOB_INDY_SEED)
                logger.debug("TheOrgBook DID:" + tob_did)

                # Check if my jurisdiction exists by name
                jurisdictions = requests.get(
                    tob_base_url + '/jurisdictions').json()

                jurisdiction_id = None
                for jurisdiction in jurisdictions:
                    if jurisdiction['name'] == config['jurisdiction_name']:
                        jurisdiction_id = jurisdiction['id']
                        break

                # If it doesn't, then create it
                if not jurisdiction_id:
                    jurisdiction = requests.post(
                        tob_base_url + '/jurisdictions',
                        json={
                            'name':             config['jurisdiction_name'],
                            'abbrv':            config['jurisdiction_abbreviation'],
                            'displayOrder':     0,
                            'isOnCommonList':   True,
                            'effectiveDate':    now
                        }).json()
                    jurisdiction_id = jurisdiction['id']

                # Check if my issuer record exists by name
                issuer_services = requests.get(
                    tob_base_url + '/issuerservices').json()

                for issuer_service in issuer_services:
                    if issuer_service['name'] == config['name'] and \
                            issuer_service['DID'] == agent.did:
                        issuer_service_id = issuer_service['id']
                        break

                # If it doesn't, then create it
                if not issuer_service_id:
                    issuer_service = requests.post(
                        tob_base_url + '/issuerservices',
                        json={
                            'name':             config['name'],
                            'issuerOrgTLA':     config['abbreviation'],
                            'DID':              agent.did,
                            'issuerOrgURL':     '',
                            'effectiveDate':    now,
                            'jurisdictionId':   jurisdiction_id
                        }).json()
                    issuer_service_id = issuer_service['id']

                return issuer_service_id

        logger.debug("running ...")
        issuer_service_id = eventloop.do(run())

        # Publish the schemas I care about to the ledger
        # then register them in TheOrgBook
        schema_manager = SchemaManager()

        for schema in schema_manager.schemas:
            # Publish to ledger
            schema_manager.publish_schema(schema)
            # Register in TheOrgBook
            # Check if my schema record exists by claimType
            claim_types = requests.get(
                tob_base_url + '/verifiableclaimtypes').json()
            claim_type_exists = False
            for claim_type in claim_types:
                if claim_type['schemaName'] == schema['name'] and \
                        claim_type['schemaVersion'] == schema['version'] and \
                        claim_type['issuerServiceId'] == issuer_service_id:
                    claim_type_exists = True
                    break

            # If it doesn't, then create it
            if not claim_type_exists:
                requests.post(
                    tob_base_url + '/verifiableclaimtypes',
                    json={
                        'claimType':        config['name'],
                        'issuerServiceId':  issuer_service_id,
                        'issuerURL':        app_url,
                        'effectiveDate':    now,
                        'schemaName':       schema['name'],
                        'schemaVersion':    schema['version']
                    }).json()
