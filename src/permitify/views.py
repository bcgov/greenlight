from django.shortcuts import render

from von_connector.config import Configurator


configurator = Configurator()


def index(request):
    return render(request, 'index.html', configurator.config)


def submit_claim(request):
    pass
    # 1. Extract form data from request

    # 2. Validate data

    # 3. Generate claim definition from form data

    # 4. Send claim definition to TheOrgBook

    # 5. Generate claim using claim request

    # 6. Send claim to TheOrgBook

    # 7. 
