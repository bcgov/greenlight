FROM bcgov-s2i-caddy:latest

USER root

ADD docker/proxy/s2i/bin/ /tmp/scripts/

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/

# assign the right permissions to the /srv folder (and subfolders)
# so we can run the instructions in the assemble-runtime script
#RUN chmod -R g+rwx /srv

#USER 1001
