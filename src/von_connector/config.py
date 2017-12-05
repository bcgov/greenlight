import os
import toml

from django.conf import settings

import logging
logger = logging.getLogger(__name__)


class Configurator():

    config = {}

    def __init__(self):
        # Load entity config
        config_path = os.path.abspath(settings.BASE_DIR + '/config.toml')
        try:
            with open(config_path, 'r') as config_file:
                config_toml = config_file.read()
        except FileNotFoundError as e:
            logger.error('Could not find config.toml. Exiting.')
            return

        self.config = toml.loads(config_toml)
