var {isProd, stage} = require('../env');
var fundebug = require('fundebug-nodejs');
var {code, plInfo} = require('../config');

if (!isProd()) {
  fundebug.config({
    silent: true
  })
}

const config = {
  silent:       false,
  apikey:       'bdef0ff138fce83405de9f86a2cc205ef478981724890e8fec404e4b05d2eca2',
  releaseStage: stage(),
  appVersion:   code.versionNum,
  user: {
    name: plInfo.name
  },
  metaData: {
    codeId: code.codeId
  }
}

module.exports = fundebug;

module.exports.FunDebugTransport = require('./FunDebugTransport');
module.exports.config = config;