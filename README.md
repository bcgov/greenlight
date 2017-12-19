# Permitify
A end-to-end demonstration of the VON in action.

Includes a "roadmap" site which the user can follow like a checklist.

Also includes the precursor to the von-connector. The goal is to allow all issuers and verifiers to be declaratively configurable.

## Running Locally

1. First, install Docker. Download the installer for your operating system [here](https://store.docker.com/search?type=edition&offering=community). Once it is installed, keep the Docker daemon running in the background.

2. Linux users will also need to [install docker-compose](https://github.com/docker/compose/releases). Mac and Windows users will have this already. 

3. Once Docker has been installed, open a terminal session and clone this repository:

```bash
git clone <repository url> permitify && cd permitify
```

4. Now you can build the Dockerfile into an image which we will use to run containers (this process will take several minutes):

```bash
./manage build
```

5. Once the build process completes, you can test the build to make sure everything works properly:

```bash
./manage start
```

You should now be able to visit the services on the following urls:

- localhost:3000
- localhost:4000

And any other services that are later defined in docker-compose.yml.

Services are defined using config files. See ./site_templates for examples of the existing services.

## Caveats

### General

You may receive errors that look something like this:

```
Casting error to ErrorCode: Rejected by pool: {"op":"REQNACK","reqId":1513638530415465900,"reason":"client request invalid: ColdNotAuthenticate('Can not find verkey for DID QmaAjcfw2HCgydR1daFg9V',)","identifier":"QmaAjcfw2HCgydR1daFg9V"}
```

This indicates the agent has not been registered and you need to authorize a new DID for the agent.  Use the [VON-Network](http://138.197.170.136) site to do this.  The seeds for the agents are defined in the config.toml file for each site.

Examples:

```
http://138.197.170.136/register?seed=bc_registries_agent_000000000000
http://138.197.170.136/register?seed=worksafe_bc_agent_00000000000000
```

### On dev machines

- If you get WalletNotFoundError when submitting a claim, try incrementing the schema version and fully restarting the server. This will re-publish the schema and related claim definition which should fix this. This can occur if the wallet didn't persist properly from a previous restart and the definition cannot be found in the wallet. **This will also be needed on first run.**

- For Django's hot-reloading to work in development, the src directory needs to mounted as a volume. This only works when one "service" is defined in the docker-compose.yml since multiple services will clobber each other's config files that get copied in.

- The wallet directory must be mounted in an internal volume. See docker-compose.yml for example.

### For Wade when you deploy

- This Dockerfile doesn't concern itself with users. It just runs as root. I would use TheOrgBook's Dockerfile as a guide and go from there when deploying to openshift.

- The wallet directory will need to be mounted on a persistent volume. `$HOME/.indy_client/wallet`

- I think I've got my fork of the von-agent reopening wallets between restarts. Look in this requirements.txt to see how to use a github git url as a dependency instead of the package from pypi.