// https://github.com/winstonjs/winston
const winston = require('winston');
const {FunDebugTransport} = require('../fundebug');
const fundebugConfig = require('../fundebug').config;
const {isProd} = require('../env')
const loggerConfig = require('../config').loggers
const path =require('path')

var transports = []

Object.keys(loggerConfig).forEach(function (loggerType) {

  var loggers = loggerConfig[loggerType]

  if ( loggerType === 'fundebug' ) {
    loggers.forEach(function (loggerLevel, i) {
      transports.push(new (FunDebugTransport)(Object.assign({ level: loggerLevel, name: loggerLevel + '_' + i, }, fundebugConfig)))
    })
  } else if ( loggerType === 'console' ) {
    loggers.forEach(function (loggerLevel, i) {
      transports.push(new (winston.transports.Console)({ colorize: true, level: loggerLevel, name: loggerLevel + '_' + i, }))
    })
  } else if ( loggerType === 'file' ) {
    loggers.forEach(function (loggerLevel, i) {
      transports.push(new (winston.transports.File)({
        name: loggerLevel + '_' + i,
        filename: path.resolve('./tmp/log/menuxx.log'),
        level: loggerLevel,
        handleExceptions : true,
        humanReadableUnhandledException : true
      }))
    })
  }
})

const logger = new (winston.Logger)({ 
  transports,
  exceptionHandlers: [
      new winston.transports.Console({
        humanReadableUnhandledException: true
      })
  ],
  exitOnError: false
});

logger.on('error', function (err) {
  console.error(err)
});

if ( isProd() ) {
  require('debug').formatArgs = function (args) {
    var name = this.namespace
    args[0] = ' ' + name + ' ' + args[0]
  }
}

module.exports = function (moduleName) {
  // https://github.com/visionmedia/debug
  require('debug').log = function noop(){};
  var log = require('debug')(moduleName);
  var errorlog = require('debug')(moduleName + ':error');
  log.log = logger.info.bind(logger);
  errorlog.log = logger.error.bind(logger);
  return { log, errorlog };
}