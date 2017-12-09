#!/bin/bash

TEMPLATE_NAME=$1
TEMPLATE_DIRECTORY=/app/site_templates/"$TEMPLATE_NAME"

echo "Using template $TEMPLATE_NAME"
shift

if [ -d "$TEMPLATE_DIRECTORY" ]; then
    cp "$TEMPLATE_DIRECTORY"/* . 
else
    echo "Directory $TEMPLATE_DIRECTORY doesn't exist."
    exit 1
fi

# python3 manage.py migrate
exec "$@"