from django.apps import AppConfig


class VonConnectorConfig(AppConfig):
    name = 'von_connector'

    def ready(self):
        pass
        # TODO: publish schema to ledger
