from datetime import datetime
import os
import json

import requests

from .schema import SchemaManager
from .config import Configurator
from .agent import Agent

from django.apps import AppConfig
from django.conf import settings

import logging
logger = logging.getLogger(__name__)


class VonConnectorConfig(AppConfig):
    name = 'von_connector'

    def ready(self):
        agent = Agent()
        config = Configurator().config
        now = datetime.now().strftime("%Y-%m-%d")

        # Register myself with TheOrgBook
        tob_base_url = os.getenv('THE_ORG_BOOK_BASE_URL')
        # Check if my jurisdiction exists by name
        jurisdictions = requests.get(tob_base_url + '/jurisdictions').json()

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
        issuer_services = requests.get(tob_base_url + '/issuerservices').json()
        issuer_service_id = None
        for issuer_service in issuer_services:
            if issuer_service['name'] == config['name']:
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
                    'issuerOrgURL':     config['url'],
                    'effectiveDate':    now,
                    'jurisdictionId':   jurisdiction_id
                }).json()
            issuer_service_id = issuer_service['id']

        # Publish the schemas I care about to the ledger
        # then register them in TheOrgBook
        schema_manager = SchemaManager()
        schemas_path = os.path.abspath(settings.BASE_DIR + '/schemas.json')
        try:
            with open(schemas_path, 'r') as schemas_file:
                schemas_json = schemas_file.read()
        except FileNotFoundError as e:
            logger.error('Could not find schemas.json. Exiting.')
            return
        schemas = json.loads(schemas_json)
        for schema in schemas:
            # Publish to ledger
            schema_manager.publish_schema(schema)
            # Register in TheOrgBook
            # Check if my schema record exists by claimType
            claim_types = requests.get(
                tob_base_url + '/verifiableclaimtypes').json()
            claim_type_exists = False
            for claim_type in claim_types:
                if claim_type['claimType'] == schema['name']:
                    claim_type_exists = True
                    break

            # If it doesn't, then create it
            if not claim_type_exists:
                requests.post(
                    tob_base_url + '/verifiableclaimtypes',
                    json={
                        'claimType':        schema['name'],
                        'issuerServiceId':  issuer_service_id,
                        'issuerURL':        'no',
                        'effectiveDate':    now,
                        'schema_name':      schema['name'],
                        'schema_version':   schema['version']
                    }).json()
