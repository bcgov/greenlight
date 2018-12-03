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

export APP_NAME=${APP_NAME:-runner}
export HOST_IP=${HOST_IP:-0.0.0.0}
export HOST_PORT=${HOST_PORT:-8000}

isInstalled(){
  rtnVal=$(type "$1" >/dev/null 2>&1)
  rtnCd=$?
  if [ ${rtnCd} -ne 0 ]; then
    return 1
  else
    return 0
  fi
}

enableGunicorn(){
  if [ ! -z "$ENABLE_GUNICORN" ] && [ "$ENABLE_GUNICORN" = "1" ] && ! isInstalled gunicorn; then
    echo "ENABLE_GUNICORN has been set, however gunicorn was not found."
    echo "Setting ENABLE_GUNICORN to 0 ..."
    export ENABLE_GUNICORN=0
  fi
}

CMD="$@"
if [ -z "$CMD" ]; then
  enableGunicorn
  if [ -z "$ENABLE_GUNICORN" ] || [ "$ENABLE_GUNICORN" = "0" ]; then
    CMD="python ${APP_NAME}.py"
  else
    CMD="gunicorn --bind ${HOST_IP}:${HOST_PORT} -c gunicorn_config.py dflow.common:init_app"
  fi
fi

echo "Starting server ..."
exec $CMD
