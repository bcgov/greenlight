# FROM dflow-angular-build:latest as dflow-builder
FROM abiosoft/caddy:no-stats

# Expose this variable to OpenShift
LABEL io.openshift.s2i.scripts-url=image:///usr/libexec/s2i

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/

# COPY --from=dflow-builder /opt/app-root/src/dist/dflow-demo/ .
