#!/usr/bin/env python3
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
import os
import sys

import aiohttp

AGENT_URL = os.environ.get('AGENT_URL', 'http://localhost:5000/bcreg')

if len(sys.argv) < 2:
    raise ValueError("Expected legal_entity_id(s)")
ENTITY_IDS = sys.argv[1:]

async def request_proof(http_client, proof_name, proof_filters):
    print('Requesting proof: {} {}'.format(proof_name, proof_filters))

    try:
        response = await http_client.post(
            '{}/request-proof'.format(AGENT_URL),
            params={'name': proof_name},
            json={'filters': proof_filters},
        )
        if response.status != 200:
            raise RuntimeError(
                'Proof request could not be processed: {}'.format(await response.text())
            )
        result_json = await response.json()
    except Exception as exc:
        raise Exception(
            'Could not complete proof request. '
            'Are von-x and TheOrgBook running?') from exc

    print('Response from von-x:\n\n{}\n'.format(result_json))

async def request_all(entity_ids):
    async with aiohttp.ClientSession() as http_client:
        for entity_id in entity_ids:
            await request_proof(http_client, 'registration', {'legal_entity_id': entity_id})

asyncio.get_event_loop().run_until_complete(request_all(ENTITY_IDS))
