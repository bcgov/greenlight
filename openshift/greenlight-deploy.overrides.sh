# ========================================================================
# Special Deployment Parameters needed for the greenlight instance.
# ------------------------------------------------------------------------
# The results need to be encoded as OpenShift template
# parameters for use with oc process.
#
# The generated config map is used to update the Caddy configuration.
# ========================================================================

CONFIG_MAP_NAME=greenlight-caddy-conf
SOURCE_FILE=../caddy/Caddyfile
OUTPUT_FORMAT=json
OUTPUT_FILE=greenlight-caddy-configmap_DeploymentConfig.json

generateConfigMap() {
  _config_map_name=${1}
  _source_file=${2}
  _output_format=${3}
  _output_file=${4}
  if [ -z "${_config_map_name}" ] || [ -z "${_source_file}" ] || [ -z "${_output_format}" ] || [ -z "${_output_file}" ]; then
    echo -e \\n"generateConfigMap; Missing parameter!"\\n
    exit 1
  fi

  oc create configmap ${_config_map_name} --from-file ${_source_file} --dry-run -o ${_output_format} > ${_output_file}
}

generateConfigMap "${CONFIG_MAP_NAME}" "${SOURCE_FILE}" "${OUTPUT_FORMAT}" "${OUTPUT_FILE}"

SPECIALDEPLOYPARMS=""
echo ${SPECIALDEPLOYPARMS}

