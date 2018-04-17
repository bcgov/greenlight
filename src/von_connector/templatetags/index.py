from django.template.defaulttags import register

@register.filter
def index(sequence, position):
    return sequence[position]