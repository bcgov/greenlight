FROM bcdevops/s2i-caddy:latest

ADD docker/proxy/s2i/bin/ /tmp/scripts/

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/
