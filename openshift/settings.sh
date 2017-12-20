# bash script to be sourced to set environment variables for OpenShift scripts

# git bash hack on windows - deals with pathname conversions from dos to unix-style
export MSYS_NO_PATHCONV=1

# Project Variables
export PROJECT_DIR=..
export PROJECT_OS_DIR=.
export OC_ACTION=${OC_ACTION:-create}
export DEV=dev
export TEST=test
export PROD=prod

# The templates that should not have their GIT referances(uri and ref) over-ridden
# Templates NOT in this list will have they GIT referances over-ridden
# with the values of GIT_URI and GIT_REF
export -a skip_git_overrides=("")
export GIT_URI="https://github.com/bcgov/permitify.git"
export GIT_REF="master"

export PROJECT_NAMESPACE=${PROJECT_NAMESPACE:-devex-von-permitify}
export TOOLS=${PROJECT_NAMESPACE}-tools
export DEPLOYMENT_ENV_NAME="${DEPLOYMENT_ENV_NAME:-${DEV}}"
export BUILD_ENV_NAME="tools"
export LOAD_DATA_SERVER="dev"
export TEMPLATE_DIR=templates
export PIPELINE_JSON=https://raw.githubusercontent.com/BCDevOps/openshift-tools/master/provisioning/pipeline/resources/pipeline-build.json
export COMPONENT_JENKINSFILE=../Jenkinsfile
export PIPELINEPARAM=pipeline.param
export APPLICATION_DOMAIN_POSTFIX=".pathfinder.gov.bc.ca"

# Jenkins account settings for initialization
export JENKINS_ACCOUNT_NAME="jenkins"
export JENKINS_SERVICE_ACCOUNT_NAME="system:serviceaccount:${TOOLS}:${JENKINS_ACCOUNT_NAME}"
export JENKINS_SERVICE_ACCOUNT_ROLE="edit"

# Gluster settings for initialization
export GLUSTER_ENDPOINT_CONFIG=https://raw.githubusercontent.com/BCDevOps/openshift-tools/master/resources/glusterfs-cluster-app-endpoints.yml
export GLUSTER_SVC_CONFIG=https://raw.githubusercontent.com/BCDevOps/openshift-tools/master/resources/glusterfs-cluster-app-service.yml
export GLUSTER_SVC_NAME=glusterfs-cluster-app

# The project components
# - They are all contained under the main OpenShift folder.
export -a components=(".")

# The builds to be triggered after buildconfigs created (not auto-triggered)
export -a builds=()

# The images to be tagged after build
export -a images=("permitify")

# The routes for the project
export -a routes=("bc-registries" "worksafe-bc")

# Load in any overrides
if [ ! -z "${APPLY_LOCAL_SETTINGS}" ] && [ -f ./settings.local.sh ]; then
  echo -e \\n"Overriding default settings, loading local project settings from $PWD/settings.local.sh ..."\\n
  . ./settings.local.sh
fi
