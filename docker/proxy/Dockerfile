FROM bcdevops/s2i-caddy:latest

USER root

ADD docker/proxy/s2i/bin/ /tmp/scripts/

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/
