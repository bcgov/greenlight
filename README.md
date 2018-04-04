# Permitify
A end-to-end demonstration of the VON in action.

Includes a "roadmap" site which the user can follow like a checklist.

Also includes the precursor to the von-connector. The goal is to allow all issuers and verifiers to be declaratively configurable.

## Running in OpenShift

This project uses the scripts found in [openshift-project-tools](https://github.com/BCDevOps/openshift-project-tools) to setup and maintain OpenShift environments (both local and hosted).  Refer to the [OpenShift Scripts](https://github.com/BCDevOps/openshift-project-tools/blob/master/bin/README.md) documentation for details.

## Running Locally

0. An instance of TheOrgBook must be running. By default, Permitify looks for TheOrgBook running on your local machine. Look here for instructions on running TheOrgBook: https://github.com/bcgov/TheOrgBook

1. First, install Docker. Download the installer for your operating system [here](https://store.docker.com/search?type=edition&offering=community). Once it is installed, keep the Docker daemon running in the background.

2. Linux users will also need to [install docker-compose](https://github.com/docker/compose/releases). Mac and Windows users will have this already. 

3. Once Docker has been installed, open a terminal session and clone this repository:

```bash
git clone <repository url> permitify && cd permitify/docker
```

4. Now you can build the Dockerfile into an image which we will use to run containers (this process will take several minutes):

```bash
./manage build
```

5. Once the build process completes, you can test the build to make sure everything works properly:

You will need to choose a unique seed value for development. Use a value that no one else is using. It must be 32 characters long exactly.

```bash
./manage start all seed=my_unique_seed_00000000000000000
```

When you run the services, each service will use a seed derived from the seed you pass in. Currently, it increments the last character value for each service. So for the example above, it will use the follow seeds for each service:

- my_unique_seed_00000000000000001
- my_unique_seed_00000000000000002
- my_unique_seed_00000000000000003
- my_unique_seed_00000000000000004
- my_unique_seed_00000000000000005
- my_unique_seed_00000000000000006

You can see which seed value each service using by looking at the logs like this:

```
----------------------------------------------------------------------------------
No command line parameters were provided to the entry point.
Using the values specified for the environment, or defaults if none are provided.

TEMPLATE_NAME: bc_registries
APPLICATION_IP: 0.0.0.0
APPLICATION_PORT: 8080
INDY_WALLET_SEED: my_seed_000000000000000000000001
----------------------------------------------------------------------------------
```

Each seed, must be authorized on the indy ledger! If you are using the https://github.com/bcgov/von-network network locally, you can visit the webserver running on your local machine to authorize the did for each seed. If you are using the shared development Indy ledger (which is an instance of von-network), you can visit this page to authorize your did: http://159.89.115.24

You should now be able to visit the services on the following urls:

- localhost:5000
- localhost:5001
- localhost:5002
- localhost:5003
- localhost:5004
- localhost:5005

And any other services that are later defined in docker-compose.yml.

Services are defined using config files. See ./site_templates for examples of the existing services.

During development, you can run

```bash
./manage start seed=my_unique_seed_00000000000000000
```

which will only start the first service with the source directory mounted as a volume for quicker development.


## Caveats

### General

You may receive errors that look something like this:

```
Casting error to ErrorCode: Rejected by pool: {"op":"REQNACK","reqId":1513638530415465900,"reason":"client request invalid: ColdNotAuthenticate('Can not find verkey for DID QmaAjcfw2HCgydR1daFg9V',)","identifier":"QmaAjcfw2HCgydR1daFg9V"}
```

This indicates the agent has not been registered and you need to authorize a new DID for the agent.  Use the [VON-Network](http://159.89.115.24) site to do this.  The seeds for the agents are defined in the config.toml file for each site.

Examples:

```
http://159.89.115.24/register?seed=bc_registries_agent_000000000000
http://159.89.115.24/register?seed=worksafe_bc_agent_00000000000000
```

### On dev machines

- If you get WalletNotFoundError when submitting a claim, try incrementing the schema version and fully restarting the server. This will re-publish the schema and related claim definition which should fix this. This can occur if the wallet didn't persist properly from a previous restart and the definition cannot be found in the wallet. **This will also be needed on first run.**

- For Django's hot-reloading to work in development, the src directory needs to mounted as a volume. This only works when one "service" is defined in the docker-compose.yml since multiple services will clobber each other's config files that get copied in.

- The wallet directory must be mounted in an internal volume. See docker-compose.yml for example.

## Setting up a new issuing service in Permitify

The steps below describe how to register a service (i.e. Ontario Corporate Registry, “OntarioReg”) that issues **foundational** claims (i.e. incorporation) for a business and loads test data for the new service into TheOrgBook using load scripts. The new service is added to the **local** instance of Permitify.

Prerequisites:
 -  von-network and TheOrgBook local instances are running at http://localhost:9000 and http://localhost:8080 respectively
 -  the seeds for TheOrgBook and the new service are registered in the von-network throug the UI (http://localhost:9000)
 -  the test claim data is available under TheOrgBook/APISpec/TestData/OntClaims in OntClaims_XXX.json files

Data Convention:
 - Make sure to include the word “Reg” in the service name in order for the claims issued by the service to be processed as foundational claims (i.e. OntarioReg)
 - Include “incorporation” in the schema name for the claims issued by the new service in order for the claims to be processed as foundational claims (I.e. “incorporation.on_biz”, “incorporation.bc_regisgries”)
  - the province's abbreviation (i.e. "Ont") should be included in the data directory name (i.e. OntClaims) and the name of the test data json file (i.e.OntClaims_XXXX.json). **The scripts are case-sensitive.**

1. Create a subdirectory with the name of the new service under ‘permitify/site_templates’

  ```
  mkdir on_biz
  ```

2.  Copy config.toml and schema.json file into the “on_biz” directory from the directory of another service that issues foundational claims (i.e. bc_registries):

```cd on_biz
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
            "schema": "incorporation.on_biz"
        }
    ]
}
```
```
schema.json
[
    {
        "name": "incorporation.on_biz",
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
on_biz:
    image: permitify
    environment:
      PYTHON_ENV: development
      THE_ORG_BOOK_API_URL: ${THE_ORG_BOOK_API_URL}
      THE_ORG_BOOK_APP_URL: ${THE_ORG_BOOK_APP_URL}
      DISCONNECTED: '${DISCONNECTED-false}'
      TEMPLATE_NAME: on_biz
      APPLICATION_IP: 0.0.0.0
      APPLICATION_PORT: 8080
      APPLICATION_URL: ${APPLICATION_URL}:5000
      INDY_WALLET_SEED: ${INDY_WALLET_SEED}7
      TOB_INDY_SEED: ${TOB_INDY_SEED}
      LEDGER_URL: ${LEDGER_URL}
    volumes:
      - on_biz_wallet:/app/.indy_client/wallet
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
  on_biz_wallet:
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
    on_biz\
"
```

Optional: if you want to create an input form for the new service and submit claims manually. Create src/static/js/onbis.js,  src/templates/on_biz.index.html, src/templates/ongov.admin.index.html and src/templates/ongov.index.html by copying other issuing service’s files and modify for the new service.

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
        # on_biz
        'OntarioReg': "http://localhost:5006"
    },
....
```

6. Test that the new service is available at [http://localhost:5006](http://localhost:5006)

7. Run the load script to load the data into TheOrgBook from OntClaims data directory using the **local** instance of the new service in Permitify

```
cd TheOrgBook/APISpec/TestData
./load-all.sh local Ont
```