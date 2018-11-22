# build angular app
FROM node:carbon as angular-builder
WORKDIR /app
ADD dflow-demo /app
RUN npm install
ENV PATH="/app/node_modules/@angular/cli/bin:${PATH}"
RUN ng build --prod

# package built artifacts into caddy
FROM abiosoft/caddy:no-stats
ADD caddy/Caddyfile /etc/Caddyfile
WORKDIR /srv
COPY --from=angular-builder /app/dist/dflow-demo/ .
ADD assets/ ./assets/
