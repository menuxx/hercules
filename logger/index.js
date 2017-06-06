const winston = require('winston');
const {FunDebugTransport} = require('../fundebug');
const fundebugConfig = require('../fundebug').config;
const {isProd} = require('../env')
const loggerConfig = require('../config').loggers
const path =require('path')

Object.keys(loggerConfig).forEach(function (loggerType) {
  
  var transports = []

  var loggers = loggerConfig[loggerType]

  if ( loggerType === 'fundebug' ) {
    loggers.forEach(function (loggerLevel) {
      transports.push(new (FunDebugTransport)(Object.assign({ level: loggerLevel }, fundebugConfig)))
    })
  } else if ( loggerType === 'console' ) {
    loggers.forEach(function (loggerLevel) {
      transports.push(new (winston.transports.Console)({ level: loggerLevel }))
    })
  } else if ( loggerType === 'file' ) {
    loggers.forEach(function (loggerLevel) {
      transports.push(new (winston.transports.File)({
        filename: path.resolve('../tmp/log/menuxx.log'),
        level: loggerLevel,
        handleExceptions : true,
        humanReadableUnhandledException : true
      }))
    })
  }
})

const logger = new (winston.Logger)({ transports });

if ( isProd() ) {
  require('debug').formatArgs = function (args) {
    const name = this.namespace
    args[0] = ' ' + name + ' ' + args[0]
  }
}

module.exports = function (moduleName) {
  var log = require('debug')(moduleName);
  var errorlog = require('debug')(moduleName + ':error');
  log.log = logger.info.bind(logger);
  errorlog.log = logger.error.bind(logger);
  return { log, errorlog };
}