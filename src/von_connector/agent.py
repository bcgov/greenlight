from . import eventloop

from .config import Configurator

from von_agent.nodepool import NodePool
from von_agent.agents import Issuer

config = Configurator().config


class Agent:
    # Singleton
    class Singleton:
        async def start(self):
            pool = NodePool(
                'permitify',
                '/app/.genesis')
            await pool.open()

            self.issuer = Issuer(
                pool,
                config['wallet_seed'],
                config['name'] + ' Wallet',
                None,
                '127.0.0.1',
                9703,
                'api/v0')

            await self.issuer.open()

        def __getattr__(self, name):
            return getattr(self.issuer, name)

    instance = None

    def __init__(self):
        if not Agent.instance:
            Agent.instance = Agent.Singleton()
            eventloop.do(Agent.instance.start())

    def __getattr__(self, name):
        return getattr(self.instance, name)
