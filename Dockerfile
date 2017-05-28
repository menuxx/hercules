FROM keymetrics/pm2-docker-alpine:latest

ENV PORT 8080
RUN apk update
RUN apk install git
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
CMD ["pm2-docker", "process.yml", "--only", "MenuxxWeixinComponent"]
EXPOSE 8080