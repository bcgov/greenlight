export PROJECT_NAMESPACE=${PROJECT_NAMESPACE:-devex-von-permitify}
export GIT_URI=${GIT_URI:-"https://github.com/bcgov/permitify.git"}
export GIT_REF=${GIT_REF:-"master"}

# The project components
# - They are all contained under the main OpenShift folder.
export -a components=(".")

# The builds to be triggered after buildconfigs created (not auto-triggered)
export -a builds=()

# The images to be tagged after build
export -a images=("permitify")

# The routes for the project
export -a routes=("bc-registries" "worksafe-bc")