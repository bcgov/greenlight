import os
import platform
import requests
from pathlib import Path

import logging
logger = logging.getLogger(__name__)


def getGenesisData():
    """
    Get a copy of the genesis transaction file from the web.
    """
    ledgerUrl = os.getenv('LEDGER_URL').lower()
    if not ledgerUrl:
        raise Exception('LEDGER_URL must be set.')

    logger.info('Using genesis transaction file from {}/genesis ...'.format(ledgerUrl))
    response = requests.get('{}/genesis'.format(ledgerUrl))
    return response.text

def checkGenesisFile(genesis_txn_path):
    """
    Check on the genesis transaction file and create it is it does not exist.
    """
    genesis_txn_file = Path(genesis_txn_path)
    if not genesis_txn_file.exists():
        if not genesis_txn_file.parent.exists():
          genesis_txn_file.parent.mkdir(parents = True)
        data = getGenesisData()
        logger.info('Writing genesis transaction file to, {} ...'.format(genesis_txn_path))
        with open(genesis_txn_path, 'x') as genesisFile:
            genesisFile.write(data)
    else:
        logger.info('The genesis transaction file ({}) already exists.'.format(genesis_txn_path))
 
def config():
    """
    Get the hyperledger configuration settings for the environment.
    """
    appRoot = os.getenv('APP_ROOT')
    if not appRoot:
        appRoot = os.getenv('HOME', '/home/indy')

    genesis_txn_path = os.path.join(appRoot, 'genesis')
    checkGenesisFile(genesis_txn_path)

    return {
        "genesis_txn_path": genesis_txn_path,
    }
