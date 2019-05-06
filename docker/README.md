# Running GreenLight with Docker Compose

The following instructions provide details on how to deploy GreenLight using Docker Compose.  This method of deployment is intended for local development and demonstration purposes.  It is **NOT** intended to be support production level deployments where security, availability, resilience, and data integrity are important.

All application services are exposed to the host so they may be easily accessed individually for development and testing purposes.

## Prerequisites

* Docker and Docker Compose
  * Install and configure Docker and Docker compose for your system.
* The S2I CLI
  * Download and install the S2I CLI tool; [source-to-image](https://github.com/openshift/source-to-image)
  * Make sure it is available on your `PATH`.  The `manage` will look for the `s2i` executable on your `PATH`.  If it is not found you will get a message asking you to download and set it on your `PATH`.

## Quick Start Guide

For basic instructions on running a full local demo of the VON Network with GreenLight, see the [Quick Start Guide](VONQuickStartGuide.md).

## Management Script

The `manage` script (in the repo's `docker` directory) wraps the Docker and S2I process in easy to use commands.

To get full usage information on the script run:

```sh
./manage
```
  
## Building the Images

The first thing you'll need to do is build the Docker images.  Since this requires a combination of Docker and S2I builds the process has been scripted inside `manage`.  _The `docker-compose.yml` file does not perform any of the builds._

To build the images run:
```sh
./manage build
```

## Starting the Project

To start the project run:

```sh
./manage start
```

This will start the project with all of the logs being written to the command line.

The `./manage` script also supports `up` as a synonym to `start`.

## Stopping the Project

There are two commands to stop the project run:

```sh
./manage stop
```
and

```sh
./manage down
```

`stop` only stops the containers, but leaves the rest of the `docker-compose` structure in place - volumes (and the Indy wallets they store) and networking.  

`down` is destructive, removing the volumes and network elements.

Often during a debugging session, `stop` is sufficient as want to keep your wallets around. If you use `down`, you likely will have to restart the prerequisite Indy network (`von-network`).

## Using the Application

* The GreenLight user interface is exposed at [http://localhost:5000/](http://localhost:5000/)

To confirm the application initialization is complete, go to the GreenLight screen and look at the `Credentials` drop down. It should have all of the Credentials for the Issuer/Verifier Agents listed - currently 8 entries. If only some are showing, wait and refresh the screen until all are displayed.

If the user interface does not start, or the `Credentials` drop down does not populate in a reasonable amount of time - check the rolling logs for errors and stack traces.

## Health Check

To check whether the issuer services have started browse to the *healthcheck* endpoint of each service.  An **ok** response from the service indicates it is ready.  A full list of the services (and their urls) can be found in the [CaddyFile](https://github.com/bcgov/greenlight/blob/master/caddy/Caddyfile) of the GreenLight application.

[http://localhost:5000/bcreg/health](http://localhost:5000/bcreg/health)
[http://localhost:5000/finance/health](http://localhost:5000/finance/health)
[http://localhost:5000/surrey/health](http://localhost:5000/surrey/health)
[http://localhost:5000/fraser-valley/health](http://localhost:5000/fraser-valley/health)
[http://localhost:5000/liquor/health](http://localhost:5000/liquor/health)
[http://localhost:5000/worksafe/health](http://localhost:5000/worksafe/health)
[http://localhost:5000/agri/health](http://localhost:5000/agri/health)