FROM dflow-angular-build:latest as dflow-builder
FROM abiosoft/caddy:no-stats

ADD caddy/Caddyfile /etc/Caddyfile

WORKDIR /srv

ADD assets/ ./assets/

COPY --from=dflow-builder /opt/app-root/src/dist/dflow-demo/ .
