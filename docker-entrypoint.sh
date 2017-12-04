#!/bin/bash
python manage.py migrate
exec "$@"