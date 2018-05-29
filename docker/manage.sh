#!/bin/bash
#
# Copyright 2017-2018 Government of Canada - Public Services and Procurement Canada - buyandsell.gc.ca
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
# http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

export DOCKERHOST=${APPLICATION_URL-$(docker run --rm --net=host codenvy/che-ip)}
export MSYS_NO_PATHCONV=1
set -e

SCRIPT_HOME="$( cd "$( dirname "$0" )" && pwd )"

# =================================================================================================================
# Usage:
# -----------------------------------------------------------------------------------------------------------------

usage() {
  cat <<-EOF

  Usage: $0 {start|stop|build|rm|lint}

  Options:

  build - Build the docker images for the project.
          You need to do this first, since the builds require
          a combination of Docker images.

  start - Creates the application container from the built images
          and starts the services based on the docker-compose.yml file.

          You can pass in a list of containers to start.
          By default all containers will be started.

  stop - Stops the services.  This is a non-destructive process.  The containers
         are not deleted so they will be reused the next time you run start.

  rm - Removes any existing application containers.

  lint - Apply pylint to Python source code.

EOF
exit 1
}

# -----------------------------------------------------------------------------------------------------------------
# Default Settings:
# -----------------------------------------------------------------------------------------------------------------

DEFAULT_CONTAINERS=""

# -----------------------------------------------------------------------------------------------------------------
# Functions:
# -----------------------------------------------------------------------------------------------------------------

configureEnvironment () {

  if [ -f .env ]; then
    while read line; do
      if [[ ! "$line" =~ ^\# ]] && [[ "$line" =~ .*= ]]; then
        export $line
      fi
    done < .env
  fi

  for arg in $@; do
    case "$arg" in
      *=*)
        export ${arg}
        ;;
    esac
  done

  if [ "$COMMAND" == "start" ]; then
    if [ -z "$TOB_INDY_DID" ]; then
      seed="${TOB_INDY_SEED}"
      if [ -z "$seed" ]; then
        echo "You must provide an Indy seed parameter for TheOrgBook. For example: TOB_INDY_SEED=my_seed_000000000000000000000000."
        exit 1
      fi
      if [ ${#seed} -ne 32 ]; then
        echo "The seed parameter must be 32 characters long exactly."
        exit 1
      fi
    fi
  fi

  export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-"vonx"}
  export LEDGER_URL=${LEDGER_URL-http://$DOCKERHOST:9000}
  export APPLICATION_URL=${APPLICATION_URL-http://localhost:${WEB_HTTP_PORT:-5000}}
}

getStartupParams() {
  CONTAINERS=""
  ARGS=""
  if [ "$COMMAND" == "start" ]; then
    ARGS+="--force-recreate"
  fi

  for arg in $@; do
    case "$arg" in
      *=*)
        # Skip it
        ;;
     -*)
        ARGS+=" $arg";;
      *)
        CONTAINERS+=" $arg";;
    esac
  done

  if [ -z "$CONTAINERS" ]; then
    CONTAINERS="$DEFAULT_CONTAINERS"
  fi

  echo ${ARGS} ${CONTAINERS}
}

build() {
  # Build all containers in the docker-compose file
  echo -e "\nBuilding containers ..."
  echo docker-compose build $@
  docker-compose build $@
}

deleteVolumes() {
  _projectName=${COMPOSE_PROJECT_NAME:-docker}

  echo "Stopping and removing any running containers ..."
  docker-compose rm -svf >/dev/null

  _pattern="^${_projectName}_\|^docker_"
  _volumes=$(docker volume ls -q | grep ${_pattern})

  if [ ! -z "${_volumes}" ]; then
    echo "Removing project volumes ..."
    echo ${_volumes} |  xargs docker volume rm
  else
    echo "No project volumes exist."
  fi
}

pylint() {
  PYTHON=$(which python3 || which python)
  if [ -z "$PYTHON" ]; then
    echo -e "python executable could not be located"
  fi
  PIP=$(which pip3 || which pip)
  if [ -z "$PIP" ]; then
    echo -e "pip executable could not be located"
  fi
  PYLINT=$(which pylint)
  if [ -z "$PYLINT" ]; then
    echo -e "Installing pylint ..."
    $PIP install pylint
  fi
  $PIP install -q -r ../src/requirements.txt
  cd ..
  $PYLINT src/*.py src/vonx
}

# =================================================================================================================

pushd ${SCRIPT_HOME} >/dev/null
COMMAND=$1
shift || true

case "$COMMAND" in
  start)
    _startupParams=$(getStartupParams $@)
    configureEnvironment $@
    docker-compose up ${_startupParams}
    ;;
  stop)
    configureEnvironment $@
    docker-compose stop
    ;;
  rm)
    configureEnvironment $@
    deleteVolumes
    ;;
  build)
    _startupParams=$(getStartupParams $@)
    configureEnvironment $@
    build ${_startupParams}
    ;;
  lint)
    pylint
    ;;
  *)
    usage
esac

popd >/dev/null
