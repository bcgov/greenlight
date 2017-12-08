import json
from importlib import import_module

from django.http import JsonResponse
from django.shortcuts import render

from von_connector.config import Configurator
from von_connector.schema import SchemaManager

import logging
logger = logging.getLogger(__name__)

schema_manager = SchemaManager()
configurator = Configurator()


def index(request):
    return render(request, 'index.html', configurator.config)


def submit_claim(request):
    # Get json request body
    body = json.loads(request.body.decode('utf-8'))

    # Get the schema we care about by 'schema'
    # passed in request
    try:
        schema = next(
            schema for
            schema in
            schema_manager.schemas if
            schema['name'] == body['schema'])
    except StopIteration:
        raise Exception(
            'Schema type "%s" in request did not match any schemas.' %
            body['schema'])

    # Build schema body skeleton
    claim = {}
    for attr in schema['attr_names']:
        claim[attr] = None

    # Get the schema mapper we care about
    try:
        schema_mapper = next(
            schema_mapper for
            schema_mapper in
            configurator.config['schema_mappers'] if
            schema_mapper['for'] == body['schema'])
    except StopIteration:
        raise Exception(
            'Schema type "%s" in request did not match any schema mappers.' %
            body['schema'])

    # Build claim data from schema mapper
    for attribute in schema_mapper['attributes']:
        # Handle getting value from request data
        if attribute['from'] == 'request':
            claim[attribute['name']] = body[attribute['source']]
        # Handle getting value from helpers (function defined in config)
        elif attribute['from'] == 'helper':
            try:
                helpers = import_module('von_connector.helpers')
                helper = getattr(helpers, attribute['source'])
                claim[attribute['name']] = helper()
            except AttributeError:
                raise Exception(
                    'Cannot find helper "%s"' % attribute['source'])
        # Handle setting value with string literal or None
        elif attribute['from'] == 'literal':
            try:
                value = attribute['source']
            except KeyError:
                value = None

            claim[attribute['name']] = value
        # Handle getting value already set on schema skeleton
        elif attribute['from'] == 'previous':
            try:
                claim[attribute['name']] = \
                    claim[attribute['source']]
            except KeyError:
                raise Exception(
                    'Cannot find previous value "%s"' % attribute['source'])
        else:
            raise Exception('Unkown mapper type "%s"' % attribute['from'])

    schema_manager.submit_claim(schema, claim)

    return JsonResponse({'success': True})
