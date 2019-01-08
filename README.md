# dFlow

This project demonstrates a basic application for deploying the [VON-X](https://github.com/PSPC-SPAC-buyandsell/von-x) library, in order to enable issuer registration, claims verification, and credential submission to [TheOrgBook](https://github.com/bcgov/TheOrgBook). It includes Docker tooling for deployment of the application behind a Caddy reverse proxy.

## The dFlow Business Scenario

The business problem addressed in this demo is a business trying to get a Business Licence in their local municipality so that they can open a Pub. Getting such a licence is a complicated question in most areas, requiring contacting multiple jurisdictions to acquire multiple credenitals - licenses, permits, registrations, etc., each of which may require the presentation of previously acquired credentials from other sources. dFlow simplifies the problem by:

- Asking the user the business goal they are trying to achieve. In this case - a license for an alchohol serving restaurant.
  - This is not yet part of the demo, but coming Real Soon Now.
- Starting from the goal, evaluating the Hyperledger Indy prerequisite proof request to determine the credentials needed to acquire that credential.
- Repeating that process for each pre-requisite credential until all the necessary licenses are determined
- Presenting the user with a list of the credentials needed and the order of acquisition necessary to meet the prerequisites - e.g. starting from the credentials that have no prerequisites.
- Allowing the user to click from the list of needed credentials screen to either the application for that credential (if not yet acquired), or to TheOrgBook screen to see the already acquired credential.

## Running Locally

To support this application you will need a local `von-network` instance as well as a compatible version of TheOrgBook running.
See the [Quick-Start Guide](https://github.com/bcgov/TheOrgBook/blob/master/docker/README.md#running-a-complete-provisional-von-network) for details.

Once the other components are running, you can build and run this application by executing the following inside the `docker` directory
(assuming Docker and a compatible terminal are installed).

```
./manage build
./manage start
```

The dflow demo can be started at: `http://localhost:5000/demo`.  The demo starts with registering a new company with BC Registries. Once completed, the list of additional credentials needed appears. The Happy Path for the demo is to walk through acquiring the credentials in order, noting the pre-completion of information (based on proof requests) from previous steps.

To reset the demo, including removing the Indy wallets of the demo Issuers, run:

```
./manage rm
```

And then run the steps above to build (if necessary) and start dFlow.

## Running a Shared Instance

dFlow can be run on a server for multiple users. The `docker` folder provides guidance of what needs to be set up. Likewise, the `openshift` folder contains an example of deploying dflow to a `Red Hat OpenShift` instance.

## Services

Services are defined using config files. See ./config folders for examples of the existing services.

## Caveats

### On dev machines

- For Django's hot-reloading to work in development, the src directory needs to mounted as a volume. This only works when one "service" is defined in the docker-compose.yml since multiple services will clobber each other's config files that get copied in.

## Running a Complete Provisional VON Network

A "complete" provisional VON Network consists of the following components;

- A Provisional Ledger Node Pool; [von-network](https://github.com/bcgov/von-network)
- An instance of TheOrgBook; [TheOrgBook](https://github.com/bcgov/TheOrgBook)
- And a set of Issuer Services; [dFlow](https://github.com/bcgov/dflow)

Refer to the docker compose documentation in each of the projects for specific details.

### Quick Start Guide

A [Quick Start Guide](https://github.com/bcgov/TheOrgBook/tree/master/docker#quick-start-guide) can be found in the [bcgov/TheOrgBook](https://github.com/bcgov/TheOrgBook) repository.

## Adding a new issuing service to dFlow

The steps below describe how to add and register a new issuer service to a dFlow instance.

Prerequisites:
- You have followed the [OpenShift Scripts](https://github.com/BCDevOps/openshift-project-tools/blob/master/bin/README.md) environment setup instructions to install and configure the scripts for use on your system (only for OpenShift deployments).

### Create Configuration Files

First of all, we need to create the configuration files for the new issuer service. Following one of the existing agents as an example (e.g.: bcreg), create a new folder containing `routes.yml`, `schemas.yml`, `services.yml` and `settings.yml`. Name the folder using a short mnemonic, that will be used throughout the configuration (e.g.: myorg).

For more information on creating and setting up the configuration files, please refer to the documentation in [von-agent-template](https://github.com/bcgov/von-agent-template/tree/master/von-x-agent/config).

### Update Caddy Configuration

Caddy needs to be configured to support proxying requests to the new agent. To do this, add the following proxy instructions to the Caddyfile, making sure to replace _myorg_ with the mnemonic you previously picked.
```
proxy /myorg/health {%MYORG_AGENT_HOST%}:{%MYORG_AGENT_PORT%} {
    without /worksafe
}

proxy /myorg {%MYORG_AGENT_HOST%}:{%MYORG_AGENT_PORT%} {
    except /assets
    transparent
    fail_timeout 0
}
```

### Update Docker Configuration

In `docker-compose.yml`:
- add a section describing the new issuer service. Use the exisisting agents as example, and make sure to update any references to configuration files, etc.
  - remember to also add a volume for the agent, making sure the volume name and the environment variables match what is in the configuration.
```
...

myorg-agent:
    build:
      context: ..
      dockerfile: docker/agent/Dockerfile
    environment:
      DOCKERHOST: ${DOCKERHOST}
      APPLICATION_URL: ${APPLICATION_URL:-http://localhost:5000}
      ENDPOINT_URL: ${ENDPOINT_URL:-http://localhost:5000}
      CONFIG_ROOT: ../config/agri-agent
      ENVIRONMENT: ${ENVIRONMENT:-default}
      INDY_LEDGER_URL: ${LEDGER_URL:-http://localhost:9000}
      LOG_LEVEL: ${LOG_LEVEL:-}
      PYTHON_ENV: ${PYTHON_ENV:-development}
      TOB_API_URL: ${TOB_API_URL:-}
      TOB_APP_URL: ${TOB_APP_URL:-}
      POSTGRESQL_WALLET_HOST: ${POSTGRESQL_WALLET_HOST}
      POSTGRESQL_WALLET_PORT: ${POSTGRESQL_WALLET_PORT}
      POSTGRESQL_WALLET_USER: ${POSTGRESQL_USER}
      POSTGRESQL_WALLET_PASSWORD: ${POSTGRESQL_PASSWORD}
      POSTGRESQL_WALLET_ADMIN_PASSWORD: ${POSTGRESQL_ADMIN_PASSWORD}
      WALLET_ENCRYPTION_KEY: ${WALLET_ENCRYPTION_KEY}
      INDY_WALLET_TYPE: ${INDY_WALLET_TYPE}
      INDY_WALLET_SEED: ${MYORG_WALLET_SEED:-}
    networks:
      - orgbook
      - vonx
    depends_on:
      - agent-wallet-db
    volumes:
      - myorg-agent-wallet:/home/indy/.indy_client/wallet

...

volumes:
  myorg-agent-wallet:
  ...
```
- add environment variables and dependencies referencing the new agent to the `proxy-dev` and `caddy` services
```
proxy-dev:
    image: "abiosoft/caddy:no-stats"
    environment:
      ...
      MYORG_AGENT_HOST: ${MYORG_AGENT_HOST}
      MYORG_AGENT_PORT: ${MYORG_AGENT_PORT}
      ...
    depends_on:
      ...
      - myorg-agent
      ...

...

caddy:
    image: dflow
    environment:
      ...
      MYORG_AGENT_HOST: ${MYORG_AGENT_HOST}
      MYORG_AGENT_PORT: ${MYORG_AGENT_PORT}
      ...
    depends_on:
      - myorg-agent
      ...
```

In the `manage` script in the docker directory:
- export the environment variables for the new agent. See how this is done for other agents in the configuration section related to "caddy".
```
export MYORG_AGENT_HOST=${MYORG_AGENT_HOST:-myorg-agent}
export MYORG_AGENT_PORT=${MYORG_AGENT_PORT:-8000}  
```
- add the new agent to the `DEFAULT_CONTAINERS` list.
```
DEFAULT_CONTAINERS="agent-wallet-db myorg-agent bcreg-agent ministry-finance-agent city-surrey-agent fraser-valley-agent liquor-control-agent worksafe-agent"
```

### Upate OpenShift Configuration

If you use OpenShift, you will be interested in adding a new deployment configuration for the new agent, and updating the deployment configuration for dflow to correctly proxy requests.

- In the `openshift/agents` folder, copy one of the existing agents deployment configurations and create a new one.
  - Make sure to update the name and all the variables in the deployment configuration to reflect the new agent mnemonic picked for the configuration files.
- from within the `openshift` folder, run `genParams.sh` create the parameter files for the new deployment configuration.
- create an `.overrides.sh` file for the new agent, following one of the other agents as example.
