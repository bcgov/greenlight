#! /usr/local/bin/python3
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

#
# "requests" must be installed - pip3 install requests
#

import asyncio
import json
import jsonschema
import os
import sys

import aiohttp

TOB_URL = os.environ.get('TOB_URL', 'http://localhost:8080/api')

if len(sys.argv) < 2:
    raise ValueError("Expected JSON file path(s)")
ISSUER_PATHS = sys.argv[1:]


ISSUER_JSON_SCHEMA = {
  '$schema': 'http://json-schema.org/draft-04/schema',
  'type': 'object',
  'properties': {
    'issuer': {
      'type': 'object',
      'properties': {
        'did': {'type': 'string', 'minLength': 1}, # check length + valid characters?
        'name': {'type': 'string', 'minLength': 1},
        'abbreviation': {'type': 'string'},
        'endpoint': {'type': 'string'}
      },
      'required': ['did', 'name']
    },
    'jurisdiction': {
      'type': 'object',
      'properties': {
        'name': {'type': 'string', 'minLength': 1},
        'abbreviation': {'type': 'string'}
      },
      'required': ['name']
    },
    'claim-types': {
      'type': 'array',
      'items': {
        'type': 'object',
        'properties': {
          'name': {'type': 'string', 'minLength': 1},
          'schema': {'type': 'string', 'minLength': 1},
          'version': {'type': 'string', 'minLength': 1},
          'endpoint': {'type': 'string'}
        },
        'required': ['name', 'schema', 'version']
      }
    }
  },
  'required': ['issuer', 'jurisdiction']
}


async def register_issuer(http_client, issuer_path):
    with open(issuer_path) as issuer_file:
        issuer = json.load(issuer_file)
    if not issuer:
        raise ValueError('Issuer could not be parsed')

    jsonschema.validate(ISSUER_JSON_SCHEMA, issuer)

    print('Submitting issuer registration {}'.format(issuer_path))

    try:
        response = await http_client.post(
            '{}/bcovrin/register-issuer'.format(TOB_URL),
            json=issuer
        )
        if response.status != 200:
            raise RuntimeError(
                'Issuer registration could not be processed: {}'.format(await response.text())
            )
        result_json = await response.json()
    except Exception as exc:
        raise Exception(
            'Could not register issuer. '
            'Is TheOrgBook running?') from exc

    print('Response from TheOrgBook:\n\n{}\n'.format(result_json))


async def submit_all(issuer_paths):
    async with aiohttp.ClientSession() as http_client:
        for issuer_path in issuer_paths:
            await register_issuer(http_client, issuer_path)

asyncio.get_event_loop().run_until_complete(submit_all(ISSUER_PATHS))
