from datetime import datetime
import os
import json
import time
from importlib import import_module

from django.http import JsonResponse
from django.shortcuts import render, redirect

from django.http import Http404

from von_connector.config import Configurator
from von_connector.schema import SchemaManager
from von_connector.proof import ProofRequestManager
from django.contrib import messages
from django.contrib.messages import get_messages
from django.db.models import CharField
from django.db.models.functions import Length

import logging
logger = logging.getLogger(__name__)

import redis

# Get redis configuration
redis_service_name = os.getenv('REDIS_SERVICE_NAME')

# Get redis connection
if redis_service_name:
    redis_key_name = redis_service_name.upper().replace('-', '_')
    redis_host = os.getenv('{}_SERVICE_HOST'.format(redis_key_name), redis_service_name)
    redis_port = os.getenv('{}_SERVICE_PORT'.format(redis_key_name), '6379')
    redis_password = os.getenv('REDIS_PASSWORD')
    r = redis.StrictRedis(host=redis_host, port=redis_port, db=0, password=redis_password)
    r_history = redis.StrictRedis(host=redis_host, port=redis_port, db=1, password=redis_password)

schema_manager = SchemaManager()
configurator = Configurator()
CharField.register_lookup(Length, 'length')

def admin(request):

    if not redis_service_name:
        raise Exception('The REDIS_SERVICE_NAME environment variable must be defined.  REDIS_SERVICE_NAME=redis.')
    
    # Get all keys in redis
    pending_requests = []
    rkeys = r.scan()[1]
    rkeys = [byte.decode("utf-8") for byte in rkeys]
    # # logger.info('------rkeys-----')
    # logger.info(rkeys)
    for key in rkeys:
        pending_request = r.get(key).decode("utf-8")
        pending_request=json.loads(pending_request)
        pending_requests.append(pending_request)
     
    # For Approved Requests
    approved_reqs = []
    app_keys = r_history.scan()[1]
    logger.info('-----app-----')
    logger.info(app_keys)
    app_keys = [byte.decode("utf-8") for byte in app_keys]
        
    for key in app_keys: 
        approved_req = r_history.get(key).decode("utf-8")
        approved_req = json.loads(approved_req)
        logger.info('------Approved------')
        logger.info(approved_req)
        approved_reqs.append(approved_req)
        
    logger.info('\n\n\n\n\n\n')
    logger.info('--------pending requests-------')
    for req in pending_requests:
        logger.info(req)
    logger.info('-------------------------------')

    logger.info('\n\n\n\n\n\n')
    logger.info(json.dumps(configurator.config))
    return render(request, 'admin.index.html', {'pending_requests': pending_requests, 'approved_reqs': approved_reqs, 'rkeys': rkeys})

def process_request(request):   
    
    if not redis_service_name:
        raise Exception('The REDIS_SERVICE_NAME environment variable must be defined.  REDIS_SERVICE_NAME=redis.')

    body = json.loads(request.body.decode('utf-8'))
    schema = schema_manager.schemas[0]
    logger.info('----------------body')
    logger.info(body)
    # process_reqs = []

    for rkey in body: 
        # logger.info(rkey)
        # rkey_str = rkey.decode('utf-8')
        # logger.info(rkey)
        process_req=r.get(rkey).decode('utf-8')
        process_req = json.loads(process_req)
        logger.info('-----------process-------')
        logger.info(process_req)
        current_time = datetime.now().isoformat() 
        r_history.set(current_time, json.dumps(process_req))
        claim = schema_manager.submit_claim(schema, process_req)
        r.delete(rkey)
    
    # # expired_keys = r.scan()[1]
    # # for rkey in expired_keys:
    #     r.delete(rkey)
    
    return JsonResponse({'success': True, 'result': claim})

def index(request):

    # If this is the form for the foundational claim,
    # we have no prequisites so just render.e
    if 'foundational' in configurator.config and \
            configurator.config['foundational']:
        return render(
            request,
            configurator.config['template_root'],
            configurator.config
        )

    legal_entity_id = request.GET.get('org_id', None)

    # If id isn't passed in, we render a form to ask for it.
    if not legal_entity_id:
        return render(request, 'missing_id.html')

    logger.info('----\n\n\n\n\n\n{}\n\n\n\n\n'.format(legal_entity_id))

    proof_request_manager = ProofRequestManager()
    proof_response = proof_request_manager.request_proof({
        'legal_entity_id': legal_entity_id
    })

    logger.info('----\n\n\n\n\n\n{}\n\n\n\n\n'.format(proof_response))

    logger.info(legal_entity_id)

    configurator.config['proof_response'] = proof_response

    return render(
        request,
        configurator.config['template_root'],
        configurator.config
    )


def submit_claim(request):
    start_time = time.time()
    # Get json request body
    body = json.loads(request.body.decode('utf-8'))
    logger.info('-------------Int------')
    logger.info(body)

    logger.info('---------Body--------')
    for claim in body:
        logger.info(claim)
    logger.info('---------------------')

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
    
    if 'address_line_2' in claim and claim["address_line_2"]: 
      
        if not redis_service_name:
            raise Exception('The REDIS_SERVICE_NAME environment variable must be defined.  REDIS_SERVICE_NAME=redis.')

        current_time = datetime.now().isoformat() 
        r.set(current_time, json.dumps(claim))
       
        return JsonResponse({'success': True, 'result': None})
    else:
        claim = schema_manager.submit_claim(schema, claim)
        logger.info('---------claim-------')
        logger.info(claim)
        logger.info('---------End of Claim-')

        return JsonResponse({'success': True, 'result': claim})         

def verify_dba(request):
    # Get json request body
    body = json.loads(request.body.decode('utf-8'))
    if 'legal_entity_id' not in body or 'doing_business_as_name' not in body:
        raise Exception('Missing required input')
    (verified, message) = schema_manager.verify_dba(body)

    return JsonResponse({'success': verified, 'message': message})
