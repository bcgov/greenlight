from datetime import datetime
import json
from importlib import import_module

from django.http import JsonResponse
from django.shortcuts import render, redirect

from django.http import Http404

from von_connector.config import Configurator
from von_connector.schema import SchemaManager
from von_connector.proof import ProofRequestManager
from django.contrib import messages
from django.contrib.messages import get_messages

import logging
logger = logging.getLogger(__name__)

# Get redis connection
import redis
r = redis.StrictRedis(host='redis', port=6379, db=0)

schema_manager = SchemaManager()
configurator = Configurator()


def admin(request):

    # Get all keys in redis
    pending_requests = []
    rkeys = r.scan()[1]
    for key in rkeys:
        pending_request = r.get(key).decode("utf-8")
        pending_request=json.loads(pending_request)
        # if 'Maher' in pending_request:
        # if 'legal_name' in pending_request and pending_request["legal_name"] == "Maher":
        pending_requests.append(pending_request)
            
        
        
        # Address = pending_request['address_line_1'] if 'address_line_1' in pending_request else ""
        # print('The Address' + str(Address))
        
        # if  pending_request['address_line_1'] == "1224 Hillside Avenue": 
        #     pending_requests.append(pending_request)
        # else: 
        #     return render (request, 'admin.index.html', {})
        # if pending_request['address_1'] == 'BC':
        #     pending_requests.append(pending_request)
        # else
        # return render (request, '', {})
    


    logger.info('\n\n\n\n\n\n')
    logger.info('--------pending requests-------')
    for req in pending_requests:
        logger.info(req)
    logger.info('-------------------------------')

    logger.info('\n\n\n\n\n\n')
    logger.info(json.dumps(configurator.config))
    return render(request, 'admin.index.html', {'pending_requests': pending_requests, 'rkeys': rkeys})

    

# def process_request(request):
    
#     for 

#get index of keys. 

#configurator.config['temp_root_admin']

# get pending requests from redis

# render pageget 

# render(request, admin.html, { 'pending_requests': [ *requests from redis* ] })

# 2. /process_request controller

# continue submit claim...

# def index(redis)
#     // set key == 10.3; 
#     set key == 11.40; 
#     redis clear dat struct; 
#     for agent in redis:: 
#         clear cash value; 
#         If agent in redis cleared:


def index(request):

    # If this is the form for the foundational claim,
    # we have no prequisites so just render.
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

    proof_request_manager = ProofRequestManager()
    proof_response = proof_request_manager.request_proof({
        'legal_entity_id': legal_entity_id
    })

    configurator.config['proof_response'] = proof_response

    return render(
        request,
        configurator.config['template_root'],
        configurator.config
    )


def submit_claim(request):
    # Get json request body
    body = json.loads(request.body.decode('utf-8'))

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
    
    if 'legal_name' in claim and claim["legal_name"] == "Maher":
        # messages.add_message(request, messages.INFO, 'Your request is being processed by one of our representative')

        # storage = get_messages(request)
        # for message in storage:
        #     do_something_with_the_message(message)
        current_time = datetime.now().isoformat() 
        r.set(current_time, json.dumps(claim))

        # storage = get_messages(request)
        # do_something_with_the_message(message)
        
        # return redirect('/')
        return JsonResponse({'success': True, 'result': None})
    else:
        claim = schema_manager.submit_claim(schema, claim)
        logger.info('---------claim-------')
        logger.info(claim)
        logger.info('---------End of Claim-')

        return JsonResponse({'success': True, 'result': claim})
    
    # storage = get_messages(request)
    # do_something_with_the_message(message)
            

def verify_dba(request):
    # Get json request body
    body = json.loads(request.body.decode('utf-8'))
    if 'legal_entity_id' not in body or 'doing_business_as_name' not in body:
        raise Exception('Missing required input')
    (verified, message) = schema_manager.verify_dba(body)

    return JsonResponse({'success': verified, 'message': message})
