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
#pylint: disable=invalid-name

import os

capture_output = True
daemon = False
enable_stdio_inheritance = True
preload_app = True
workers = 5
worker_class = 'aiohttp.GunicornWebWorker'
worker_connections = 60
timeout = 60
backlog = 100
keepalive = 2
proc_name = None
errorlog = '-'
loglevel = 'debug'
pythonpath = '.'
accesslog = '-'
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'


def on_starting(server):
    server.log.debug('Importing von-x services: pid %s', os.getpid())
    # import the shared manager instance before any processes are forked
    # this is necessary for the pipes and locks to be inherited
    from permitify.common import MANAGER
    server.service_mgr = MANAGER

def when_ready(server):
    server.log.debug('Starting von-x services: pid %s', os.getpid())
    server.service_mgr.start_process()

def on_exit(server):
    server.log.debug('Shutting down von-x services')
    server.service_mgr.stop()
