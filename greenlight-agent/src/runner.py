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
#pylint: disable=broad-except,ungrouped-imports

"""
Standard entry point for the application (non-gunicorn)
"""

import logging

APP = None

try:
    from greenlight.common import ENV, init_app, pre_init, shutdown
    pre_init()
    APP = init_app()

except Exception:
    LOGGER = logging.getLogger(__name__)
    LOGGER.exception('Error while loading application:')

if __name__ == '__main__' and APP:
    LOGGER = logging.getLogger(__name__)

    try:
        HOST = ENV.get('HOST_IP', '0.0.0.0')
        PORT = int(ENV.get('HOST_PORT', '8000'))
        LOGGER.info('Running server on %s:%s', HOST, PORT)

        from aiohttp import web
        web.run_app(APP, host=HOST, port=PORT)
    except Exception:
        LOGGER.exception('Error while running server:')

    shutdown()
