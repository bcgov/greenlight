import os
import json

from .schema import SchemaManager

from django.apps import AppConfig
from django.conf import settings

import logging
logger = logging.getLogger(__name__)


class VonConnectorConfig(AppConfig):
    name = 'von_connector'

    def ready(self):
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
            schema_manager.publish_schema(schema)
