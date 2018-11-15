# build angular app
FROM node:carbon as builder
WORKDIR /app
RUN npm install -g @angular/cli@7.0.4
ADD dflow-demo/package.json /app/package.json
RUN npm install
ADD dflow-demo/ /app
RUN ng build --prod

# package built artifacts into caddy
FROM abiosoft/caddy:no-stats
ADD caddy/Caddyfile /etc/Caddyfile
WORKDIR /srv
COPY --from=builder /app/dist/dflow-demo .
