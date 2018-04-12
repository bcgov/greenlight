# ===============================================================
# Special Deployment Parameters needed for the Redis Deployment
# ---------------------------------------------------------------
# The results need to be encoded as OpenShift template
# parameters for use with oc process.
# ===============================================================

generatePassword() {
  # Generate a random password and Base64 encode the result ...
  _password=$( cat /dev/urandom | LC_CTYPE=C tr -dc 'a-zA-Z0-9' | fold -w 16 | head -n 1 )
  _password=$(echo -n "${_password}"|base64)  
  echo ${_password}
}

_password=$(generatePassword)

SPECIALDEPLOYPARMS="-p DATABASE_PASSWORD=${_password}"
echo ${SPECIALDEPLOYPARMS}

