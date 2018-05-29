#!/usr/bin/env python3
#
# Copyright 2017-2018 Government of Canada - Public Services and Procurement Canada - buyandsell.gc.ca
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

import aiohttp
import asyncio
import async_timeout

URL='http://localhost:5000/test'
BATCH=100
RUNS=1

async def fetch(session, url):
    async with async_timeout.timeout(30):
        #async with session.post(url, json={'test': 'object'})
        async with session.get(url) as response:
            return response.status

async def main():
    async with aiohttp.ClientSession() as session:
        tasks = [
            asyncio.ensure_future(fetch(session, URL))
            for i in range(BATCH)
        ]
        responses = await asyncio.gather(*tasks)
        print(responses)

loop = asyncio.get_event_loop()
loop.run_until_complete(main())
