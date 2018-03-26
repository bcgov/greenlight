import os
import threading

from .config import Configurator
from .helpers import uuid

from von_agent.nodepool import NodePool
from von_agent.wallet import Wallet
from von_agent.agents import _BaseAgent
from von_agent.agents import Issuer as VonIssuer
from von_agent.agents import Verifier as VonVerifier
from von_agent.agents import HolderProver as VonHolderProver

from von_connector import apps

from von_connector import genesis

import logging
logger = logging.getLogger(__name__)

config = Configurator().config

WALLET_SEED = os.environ.get('INDY_WALLET_SEED')
if not WALLET_SEED or len(WALLET_SEED) is not 32:
    raise Exception('INDY_WALLET_SEED must be set and be 32 characters long.')


def big_log(msg):
    logger.info('{}{}{}'.format(3*'\n' + 10*'=', msg, 10*'=' + 3*'\n'))


class Issuer:
    def __init__(self, legal_entity_id: str = None):
        logger.debug("Issuer __init__>>>")
        genesis_config = genesis.config()
        thread_id = threading.get_ident()
        self.pool = NodePool(
            'permitify-issuer-' + str(thread_id),
            genesis_config['genesis_txn_path'])

        issuer_type = os.environ.get('INDY_WALLET_TYPE')
        if issuer_type == 'remote':
            holder_url = os.environ.get('INDY_WALLET_URL')
            issuer_config = {'endpoint': holder_url, 'ping': 'schema/',
                             'auth': 'api-token-auth/', 'keyval': 'keyval/', 'freshness_time': 0}
            issuer_creds = {'auth_token': apps.get_remote_wallet_token(
            ), 'virtual_wallet': legal_entity_id}
            logger.debug('Using remote Cfg: {} Creds: {}'.format(
                issuer_config, issuer_creds))
        else:
            # TODO force to virtual for now
            issuer_type = 'virtual'
            issuer_config = {'freshness_time': 0}
            issuer_creds = {'key': '', 'virtual_wallet': legal_entity_id}
            logger.debug('Using virtual Cfg: {} Creds: {}'.format(
                issuer_config, issuer_creds))

        logger.debug("Issuer __init__>>> create wallet {} {} {}".format(
            issuer_type, issuer_config, issuer_creds))

        issuer_wallet = Wallet(
            self.pool,
            WALLET_SEED,
            config['name'] + '_Issuer_Wallet',
            issuer_type,
            issuer_config,
            issuer_creds)

        logger.debug("Issuer __init__>>> done {} {} {}".format(
            issuer_type, issuer_config, issuer_creds))

        self.instance = VonIssuer(
            self.pool,
            issuer_wallet
        )
        logger.debug("Issuer __init__>>> created VonIssuer")

    async def __aenter__(self):
        logger.debug("Issuer __aenter__>>>")
        big_log('await self.pool.open()')
        await self.pool.open()
        big_log('await self.instance.wallet.create()')
        big_log(threading.get_ident())
        await self.instance.wallet.create()
        big_log('return await self.instance.open()')
        return await self.instance.open()

    async def __aexit__(self, exc_type, exc_value, traceback):
        logger.debug("Issuer __aexit__>>>")
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        big_log('await self.instance.close()')
        await self.instance.close()
        big_log('await self.pool.close()')
        await self.pool.close()


class Verifier:
    def __init__(self, legal_entity_id: str = None):
        logger.debug("Verifier __init__>>>")
        genesis_config = genesis.config()
        self.pool = NodePool(
            'permitify-verifier',
            genesis_config['genesis_txn_path'])

        verifier_type = os.environ.get('INDY_WALLET_TYPE')
        if verifier_type == 'remote':
            holder_url = os.environ.get('INDY_WALLET_URL')
            verifier_config = {'endpoint': holder_url, 'ping': 'schema/',
                               'auth': 'api-token-auth/', 'keyval': 'keyval/', 'freshness_time': 0}
            verifier_creds = {'auth_token': apps.get_remote_wallet_token(
            ), 'virtual_wallet': legal_entity_id}
            logger.debug('Using remote Cfg: {} Creds: {}'.format(
                verifier_config, verifier_creds))
        else:
            # TODO force to virtual for now
            verifier_type = 'virtual'
            verifier_config = {'freshness_time': 0}
            verifier_creds = {'key': '', 'virtual_wallet': legal_entity_id}
            logger.debug('Using virtual Cfg: {} Creds: {}'.format(
                verifier_config, verifier_creds))

        logger.debug("Verifier __init__>>> {} {} {}".format(
            verifier_type, verifier_config, verifier_creds))

        verifier_wallet = Wallet(
            self.pool,
            WALLET_SEED,
            config['name'] + '_Verifier_Wallet',
            verifier_type,
            verifier_config,
            verifier_creds)

        logger.debug("Verifier __init__>>> {} {} {}".format(
            verifier_type, verifier_config, verifier_creds))

        self.instance = VonVerifier(
            self.pool,
            verifier_wallet
        )

    async def __aenter__(self):
        logger.debug("Verifier __aenter__>>>")
        await self.pool.open()
        await self.instance.wallet.create()
        return await self.instance.open()

    async def __aexit__(self, exc_type, exc_value, traceback):
        logger.debug("Verifier __aexit__>>>")
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        await self.instance.close()
        await self.pool.close()


class Holder:
    def __init__(self, legal_entity_id: str = None):
        logger.debug("Holder __init__>>>")
        genesis_config = genesis.config()
        self.pool = NodePool(
            'permitify-holder',
            genesis_config['genesis_txn_path'])

        holder_type = os.environ.get('INDY_WALLET_TYPE')
        if holder_type == 'remote':
            holder_url = os.environ.get('INDY_WALLET_URL')
            holder_config = {'endpoint': holder_url, 'ping': 'schema/',
                             'auth': 'api-token-auth/', 'keyval': 'keyval/', 'freshness_time': 0}
            holder_creds = {'auth_token': apps.get_remote_wallet_token(
            ), 'virtual_wallet': legal_entity_id}
            logger.debug('Using remote Cfg: {} Creds: {}'.format(
                holder_config, holder_creds))
        else:
            # TODO force to virtual for now
            holder_type = 'virtual'
            holder_config = {'freshness_time': 0}
            holder_creds = {'key': '', 'virtual_wallet': legal_entity_id}
            logger.debug('Using virtual Cfg: {} Creds: {}'.format(
                holder_config, holder_creds))

        logger.debug("Holder __init__>>> {} {} {}".format(
            holder_type, holder_config, holder_creds))

        holder_wallet = Wallet(
            self.pool,
            WALLET_SEED,
            config['name'] + '_Holder_Wallet',
            holder_type,
            holder_config,
            holder_creds)

        logger.debug("Holder __init__>>> {} {} {}".format(
            holder_type, holder_config, holder_creds))

        self.instance = VonHolderProver(
            self.pool,
            holder_wallet
        )

    async def __aenter__(self):
        logger.debug("Holder __aenter__>>>")
        await self.pool.open()
        await self.instance.wallet.create()
        instance = await self.instance.open()
        await self.instance.create_master_secret('secret')
        return instance

    async def __aexit__(self, exc_type, exc_value, traceback):
        logger.debug("Holder __aexit__>>>")
        if exc_type is not None:
            logger.error(exc_type, exc_value, traceback)

        await self.instance.close()
        await self.pool.close()


async def convert_seed_to_did(seed):
    genesis_config = genesis.config()
    pool = NodePool(
        'util-agent',
        genesis_config['genesis_txn_path'])

    agent_wallet = Wallet(
        pool,
        seed,
        seed + '-wallet'
    )
    agent = _BaseAgent(
        pool,
        agent_wallet,
    )

    await pool.open()
    await agent_wallet.create()

    await agent.open()
    agent_did = agent.did
    await agent.close()
    return agent_did
