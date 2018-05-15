#!/bin/bash

echoWarning (){
  _msg=${@}
  _yellow='\033[1;33m'
  _nc='\033[0m' # No Color
  echo -e "${_yellow}${_msg}${_nc}"
}

if [ -z "${@}" ]; then
  TEMPLATE_NAME=${TEMPLATE_NAME:-bc_registries}

  if [ $DEBUG ] && [ "$DEBUG" == "true" ]; then
    # Support for running in debug mode.
    set "${TEMPLATE_NAME}" "python" "manage.py" "runserver" "--noreload" "--nothreading" "0.0.0.0:8080"
  else
    set "${TEMPLATE_NAME}" "${STI_SCRIPTS_PATH}/s2i_run"
  fi
fi

TEMPLATE_NAME=${TEMPLATE_NAME:-$1}
TEMPLATE_DIRECTORY="${HOME}/site_templates/$TEMPLATE_NAME"
shift

echoWarning "=================================================================================="
echoWarning "Initializing issuer service."
echoWarning "----------------------------------------------------------------------------------"
echo
echoWarning "TEMPLATE_NAME: ${TEMPLATE_NAME}"
echoWarning "INDY_WALLET_SEED: ${INDY_WALLET_SEED}"
echoWarning "INDY_WALLET_TYPE: ${INDY_WALLET_TYPE}"
echoWarning "WEB_CONCURRENCY: ${WEB_CONCURRENCY}"
echoWarning "DEBUG: ${DEBUG}"
echoWarning "Cmd: ${@}"
echoWarning "=================================================================================="
echo

if [ -d "${TEMPLATE_DIRECTORY}" ]; then
    echo "Copying template directory; ${TEMPLATE_DIRECTORY} ..."
    echo
    cp "${TEMPLATE_DIRECTORY}"/* . 
else
    echoWarning "The issuer service template directory, ${TEMPLATE_DIRECTORY}, doesn't exist."
    echo
    exit 1
fi

echo "Starting server ..."
echo
exec "${@}"