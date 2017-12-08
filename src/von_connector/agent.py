from . import eventloop

from .config import Configurator
from .helpers import uuid

from von_agent.nodepool import NodePool
from von_agent.agents import Issuer as VonIssuer
from von_agent.agents import Verifier as VonVerifier
from von_agent.agents import HolderProver as VonHolderProver

config = Configurator().config


class Issuer:
    # Singleton
    class Singleton:
        async def start(self):
            pool = NodePool(
                'permitify-issuer',
                '/app/.genesis')
            await pool.open()

            self.issuer = VonIssuer(
                pool,
                config['wallet_seed'],
                config['name'] + ' Issuer Wallet',
                None,
                '127.0.0.1',
                9703,
                'api/v0')

            await self.issuer.open()

        def __getattr__(self, name):
            return getattr(self.issuer, name)

    instance = None

    def __init__(self):
        if not Issuer.instance:
            Issuer.instance = Issuer.Singleton()
            eventloop.do(Issuer.instance.start())

    def __getattr__(self, name):
        return getattr(self.instance, name)


class Verifier:
    # Singleton
    class Singleton:
        async def start(self):
            pool = NodePool(
                'permitify-verifier',
                '/app/.genesis')
            await pool.open()

            self.issuer = VonVerifier(
                pool,
                config['wallet_seed'],
                config['name'] + ' Verifier Wallet',
                None,
                '127.0.0.1',
                9703,
                'api/v0')

            await self.issuer.open()

        def __getattr__(self, name):
            return getattr(self.issuer, name)

    instance = None

    def __init__(self):
        if not Verifier.instance:
            Verifier.instance = Verifier.Singleton()
            eventloop.do(Verifier.instance.start())

    def __getattr__(self, name):
        return getattr(self.instance, name)


class Holder:
    # Singleton
    class Singleton:
        async def start(self):
            pool = NodePool(
                'permitify-holder',
                '/app/.genesis')
            await pool.open()

            self.issuer = VonHolderProver(
                pool,
                config['wallet_seed'],
                config['name'] + ' Holder Wallet',
                None,
                '127.0.0.1',
                9703,
                'api/v0')

            await self.issuer.open()
            await self.create_master_secret(uuid())

        def __getattr__(self, name):
            return getattr(self.issuer, name)

    instance = None

    def __init__(self):
        if not Holder.instance:
            Holder.instance = Holder.Singleton()
            eventloop.do(Holder.instance.start())

    def __getattr__(self, name):
        return getattr(self.instance, name)
