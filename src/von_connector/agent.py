import os
import uuid

from .config import Configurator
from .helpers import uuid

from von_agent.nodepool import NodePool
from von_agent.agents import Issuer as VonIssuer
from von_agent.agents import Verifier as VonVerifier
from von_agent.agents import HolderProver as VonHolderProver

from von_connector import genesis

import logging
logger = logging.getLogger(__name__)

config = Configurator().config

WALLET_SEED = os.environ.get('INDY_WALLET_SEED')
if not WALLET_SEED or len(WALLET_SEED) is not 32:
    raise Exception('INDY_WALLET_SEED must be set and be 32 characters long.')


class Issuer:
    def __init__(self):
        genesis_config = genesis.config()
        self.pool = NodePool(
            uuid.uuid4(),
            genesis_config['genesis_txn_path'])

        self.instance = VonIssuer(
            self.pool,
            WALLET_SEED,
            config['name'] + ' Issuer Wallet',
            None,
            '127.0.0.1',
            9703,
            'api/v0')

    async def __aenter__(self):
        await self.pool.open()
        return await self.instance.open()

    async def __aexit__(self, exc_type, exc_value, traceback):
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        await self.instance.close()
        await self.pool.close()


class Verifier:
    def __init__(self):
        genesis_config = genesis.config()
        self.pool = NodePool(
            uuid.uuid4(),
            genesis_config['genesis_txn_path'])

        self.instance = VonVerifier(
            self.pool,
            WALLET_SEED,
            config['name'] + ' Verifier Wallet',
            None,
            '127.0.0.1',
            9703,
            'api/v0')

    async def __aenter__(self):
        await self.pool.open()
        return await self.instance.open()

    async def __aexit__(self, exc_type, exc_value, traceback):
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        await self.instance.close()
        await self.pool.close()


class Holder:
    def __init__(self):
        genesis_config = genesis.config()
        self.pool = NodePool(
            uuid.uuid4(),
            genesis_config['genesis_txn_path'])

        self.instance = VonHolderProver(
            self.pool,
            WALLET_SEED,
            config['name'] + ' Holder Wallet',
            None,
            '127.0.0.1',
            9703,
            'api/v0')

    async def __aenter__(self):
        await self.pool.open()
        instance = await self.instance.open()
        await self.instance.create_master_secret(uuid())
        return instance

    async def __aexit__(self, exc_type, exc_value, traceback):
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        await self.instance.close()
        await self.pool.close()
