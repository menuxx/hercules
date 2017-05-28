FROM keymetrics/pm2-docker-alpine:6
ENV NPM_CONFIG_LOGLEVEL info
ENV NODE_VERSION 6.6
ENV PORT 4900
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
COPY . /usr/src/app
CMD ["pm2-docker", "process.yml", "--only", "MenuxxWeixinComponent"]
EXPOSE 4900