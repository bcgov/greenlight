# build angular app
FROM node:carbon

WORKDIR /app

ADD greenlight-demo /app

RUN npm install

ENV PATH="/app/node_modules/@angular/cli/bin:${PATH}"

RUN ng build --prod
