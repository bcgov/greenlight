FROM bcgov-s2i-caddy:latest

USER root

ADD docker/proxy/s2i/bin/ /tmp/scripts/

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/

# Create a symlink: /usr/libexec/s2i/run -> /tmp/scripts/run
# to ensure the container will run with the default
# CMD following the s2i build.
# For some reason the s2i build sets the CMD with the "default" path to the run script.
RUN mkdir -p /usr/libexec/s2i \
    && cp -s /tmp/scripts/run /usr/libexec/s2i \
    && chmod -R g+rwx /usr/libexec/s2i

# assign the right permissions to the /srv folder (and subfolders)
# so we can run the instructions in the assemble-runtime script
RUN chmod -R g+rwx /srv

USER 1001
