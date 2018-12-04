#
# Copyright 2017-2018 Government of Canada
# Public Services and Procurement Canada - buyandsell.gc.ca
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

"""
Importing this file causes the standard settings to be loaded
and a standard service manager to be created. This allows services
to be properly initialized before the webserver process has forked.
"""

import logging.config

from vonx.common import config
from vonx.indy.manager import IndyManager
from vonx.web import init_web


# Load application settings (environment)
ENV = config.load_settings()

# Load and apply logging config
LOG_CONFIG = config.load_config(ENV.get('LOG_CONFIG_PATH'))
logging.config.dictConfig(LOG_CONFIG)

MANAGER = IndyManager(ENV)


def pre_init():
    MANAGER.start_process()

async def init_app():
    return await init_web(MANAGER)

def shutdown():
    MANAGER.stop()
