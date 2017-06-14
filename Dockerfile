FROM keymetrics/pm2-docker-alpine:7
ENV PORT 8080
RUN apk update
RUN apk add git
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
CMD ["pm2-docker", "process_only_app.yml"]
EXPOSE 8080