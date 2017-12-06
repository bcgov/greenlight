from django.shortcuts import render

from von_connector.config import Configurator


configurator = Configurator()


def index(request):
    return render(request, 'index.html', configurator.config)
