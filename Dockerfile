FROM keymetrics/pm2-docker-alpine:7
RUN apk update
RUN apk add git
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
ENTRYPOINT pm2-docker process_works.yml
EXPOSE 8081