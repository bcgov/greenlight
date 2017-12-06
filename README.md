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

You should now be able to visit `localhost:8000` to view the website.

Currently, the docker environment only runs a single configuration. You can check out `/src/config.toml` and `/src/schemas/json` to see the data being used to generate the view.