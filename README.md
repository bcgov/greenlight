# Permitify

This project demonstrates a basic application for deploying the [VON-X](https://github.com/PSPC-SPAC-buyandsell/von-x) library, in order to enable issuer registration, claims verification, and credential submission to [TheOrgBook](https://github.com/bcgov/TheOrgBook). It includes Docker tooling for deployment of the application behind a Caddy reverse proxy.

## The Permitify Business Scenario

The business problem addressed in this demo is a business trying to get a Business Licence in their local municipality so that they can open a Pub. Getting such a licence is a complicated question in most areas, requiring contacting multiple jurisdictions to acquire multiple credenitals - licenses, permits, registrations, etc., each of which may require the presentation of previously acquired credentials from other sources. Permitify simplifies the problem by:

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

The permitify demo can be started at: `http://localhost:5000/demo`.  The demo starts with registering a new company with BC Registries. Once completed, the list of additional credentials needed appears. The Happy Path for the demo is to walk through acquiring the credentials in order, noting the pre-completion of information (based on proof requests) from previous steps.

To reset the demo, including removing the Indy wallets of the demo Issuers, run:

```
./manage rm
```

And then run the steps above to build (if necessary) and start Permitify.

## Running a Shared Instance

Permitify can be run on a server for multiple users. The `docker` folder provides guidance of what needs to be set up. Likewise, the `openshift` folder contains an example of deploying permitify to a `Red Hat OpenShift` instance.

## Services

Services are defined using config files. See ./config folders for examples of the existing services.

## Caveats

### On dev machines

- For Django's hot-reloading to work in development, the src directory needs to mounted as a volume. This only works when one "service" is defined in the docker-compose.yml since multiple services will clobber each other's config files that get copied in.

## Running a Complete Provisional VON Network

A "complete" provisional VON Network consists of the following components;

- A Provisional Ledger Node Pool; [von-network](https://github.com/bcgov/von-network)
- An instance of TheOrgBook; [TheOrgBook](https://github.com/bcgov/TheOrgBook)
- And a set of Issuer Services; [Permitify](https://github.com/bcgov/permitify)

Refer to the docker compose documentation in each of the projects for specific details.

### Quick Start Guide

A [Quick Start Guide](https://github.com/bcgov/TheOrgBook/tree/master/docker#quick-start-guide) can be found in the [bcgov/TheOrgBook](https://github.com/bcgov/TheOrgBook) repository.

## Setting up a new issuing service in Permitify

> **THIS INFORMATION NEEDS TO BE UPDATED TO REFLECT THE LATEST RELEASE**

The steps below describe how to register a service (i.e. Ontario Corporate Registry, “OntarioReg”) that issues **foundational** claims (i.e. incorporation) for a business and loads test data for the new service into TheOrgBook using load scripts. The new service is added to the **local** instance of Permitify.

Prerequisites:
 -  von-network and TheOrgBook local instances are running at http://localhost:9000 and http://localhost:8080 respectively
 -  the seeds for TheOrgBook and the new service are registered in the von-network throug the UI (http://localhost:9000)
 -  the test claim data is available under TheOrgBook/APISpec/TestData/OntClaims in OntClaims_XXX.json files

Data Convention:
 - Make sure to include the word “Reg” in the service name in order for the claims issued by the service to be processed as foundational claims (i.e. OntarioReg)
 - Include “incorporation” in the schema name for the claims issued by the new service in order for the claims to be processed as foundational claims (I.e. “incorporation.onbis”, “incorporation.bc_regisgries”)
  - the province's abbreviation (i.e. "Ont") should be included in the data directory name (i.e. OntClaims) and the name of the test data json file (i.e.OntClaims_XXXX.json). **The scripts are case-sensitive.**

1. Create a subdirectory with the name of the new service under ‘permitify/site_templates’

  ```
  mkdir onbis
  ```

2.  Copy config.toml and schema.json file into the “onbis” directory from the directory of another service that issues foundational claims (i.e. bc_registries):

```cd onbis
   cd bc_registries/congif.toml 
   cd bc_Registries/shema.json
```

3. Modify the copied files to match the list of fields included in the data json files, i.e.: 

```
OntClaims_1.json
{
    "OntarioReg": [
        {
            "address_line_1": "1183 Gorham Street",
            "address_line_2": "",
            "addressee": "Gilbert Schroeder",
            "city": "London",
            "country": "CA",
            "legal_name": "Schroeder Dive",
            "postal_code": "N0N 0N0",
            "province": "ON",
            "schema": "incorporation.onbis"
        }
    ]
}
```
```
schema.json
[
    {
        "name": "incorporation.onbis",
        "version": "1.0.0",
        "attr_names": [
            "legal_entity_id",
            "corp_num",
            "legal_name",
            "org_type",
            "addressee",
            "address_line_1",
            "address_line_2",
            "city",
            "province",
            "postal_code",
            "country",
            "effective_date",
            "end_date"
        ]
    }
]
```

Modify config.toml to make the input forms fields match the fields in the schema.json if you plan to use the Permitify UI to manually issue a claim.

4. Register the new service in docker_compose.yml. 
**Note: Make sure the port assigned to the new service does not conflict with the ports assigned to other services**
**
```
onbis:
    image: permitify
    environment:
      PYTHON_ENV: development
      THE_ORG_BOOK_API_URL: ${THE_ORG_BOOK_API_URL}
      THE_ORG_BOOK_APP_URL: ${THE_ORG_BOOK_APP_URL}
      DISCONNECTED: '${DISCONNECTED-false}'
      TEMPLATE_NAME: onbis
      APPLICATION_URL: ${APPLICATION_URL}:5000
      INDY_WALLET_SEED: ${INDY_WALLET_SEED}7
      TOB_INDY_SEED: ${TOB_INDY_SEED}
      LEDGER_URL: ${LEDGER_URL}
    volumes:
      - onbis_wallet:/home/indy/.indy_client/wallet
    ports:
      - 5006:8080
```

 Register the wallet for the new service in the docker-compose.yml:
```
volumes:
  worksafe_bc_wallet:
  bc_registries_wallet:
  ministry_of_finance_wallet:
  fraser_valley_health_authority_wallet:
  city_of_surrey_wallet:
  liquor_control_and_licensing_branch_wallet:
  onbis_wallet:
```
4. Add a Docker container for the new service to permitify/docker/manage.sh script:
```
ALL_CONTAINERS="\
    bc_registries\
    worksafe_bc\
    ministry_of_finance\
    fraser_valley_health_authority\
    city_of_surrey\
    liquor_control_and_licensing_branch\
    onbis\
"
```

Optional: if you want to create an input form for the new service and submit claims manually. Create src/static/js/onbis.js,  src/templates/onbis.index.html, src/templates/ongov.admin.index.html and src/templates/ongov.index.html by copying other issuing service’s files and modify for the new service.

5. Add a URL for the new service to the load script in TheOrgBook

```
cd TheOrgBook/APISpec/TestData
vi loadClaims.py
```
```
...
URLS = {
  'local': {
        # bc_registries (needs to be first)
        'Reg': 'http://localhost:5000',
        # worksafe_bc
        'Worksafe': 'http://localhost:5001',
        # ministry_of_finance
        'Finance': 'http://localhost:5002',
        # fraser_valley_health_authority
        'Health': 'http://localhost:5003',
        # city_of_surrey
        'City': 'http://localhost:5004',
        # liquor_control_and_licensing_branch
        'Liquor': 'http://localhost:5005',
        # onbis
        'OntarioReg': "http://localhost:5006"
    },
....
```

6. Test that the new service is available at [http://localhost:5006](http://localhost:5006)

7. Run the load script to load the data into TheOrgBook from OntClaims data directory using the **local** instance of the new service in Permitify

```
cd TheOrgBook/APISpec/TestData
./load-all.sh --evn local --prefix Ont
```