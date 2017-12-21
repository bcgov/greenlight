export PROJECT_NAMESPACE=${PROJECT_NAMESPACE:-devex-von-permitify}

# The templates that should not have their GIT referances(uri and ref) over-ridden
# Templates NOT in this list will have they GIT referances over-ridden
# with the values of GIT_URI and GIT_REF
export -a skip_git_overrides=("")
export GIT_URI="https://github.com/bcgov/permitify.git"
export GIT_REF="master"

# The project components
# - They are all contained under the main OpenShift folder.
export -a components=(".")

# The builds to be triggered after buildconfigs created (not auto-triggered)
export -a builds=()

# The images to be tagged after build
export -a images=("permitify")

# The routes for the project
export -a routes=("bc-registries" "worksafe-bc")