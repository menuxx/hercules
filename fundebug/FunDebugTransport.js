var util = require('util'),
    winston = require('winston'),
    os = require('os'),
    https = require('https');

//
// ### function Http (options)
// #### @options {Object} Options for this instance.
// Constructor function for the Http transport object responsible
// for persisting log messages and metadata to a terminal or TTY.
//
var FundebugHttp = module.exports = FundebugHttp = function (options) {
  winston.Transport.call(this, options);
  options = options || {};

  delete options.silent

  this.user = options.user || {};
  this.metaData = options.metaData || {};
  this.name = 'fundebug-http';
  this.apikey = options.apikey;
  this.agent = options.agent || 'winston-nodejs';
  this.releaseStage = options.releaseStage;
  this.appVersion = options.appVersion;
  this.server = {
      hostname : os.hostname(),
      platform : os.platform(),
      release  : os.release(),
      nodeVersion : process.version
  }
};

util.inherits(FundebugHttp, winston.Transport);

//
// Expose the name of this Transport on the prototype
//
FundebugHttp.prototype.name = 'fundebug-http';

//
// ### function _request (options, callback)
// #### @callback {function} Continuation to respond to when complete.
// Make a request to a winstond server or any http server which can
// handle json-rpc.
//
FundebugHttp.prototype._request = function (options, callback) {

  // Prepare options for outgoing HTTP request
  var req = https.request({
    host: 'fundebug.com',
    port: 443,
    path: '/nodejs/',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    agent: options.agent
  });

  req.on('error', callback);
  req.on('response', function (res) {
    var body = '';

    res.on('data', function (chunk) {
      body += chunk;
    });

    res.on('end', function () {
      callback(null, res, body);
    });

    res.resume();
  });
  
  console.log(options)

  req.end(new Buffer(JSON.stringify(options), 'utf8'));

};

//
// ### function log (level, msg, [meta], callback)
// #### @level {string} Level at which to log the message.
// #### @msg {string} Message to log
// #### @meta {Object} **Optional** Additional metadata to attach
// #### @callback {function} Continuation to respond to when complete.
// Core logging method exposed to Winston. Metadata is optional.
//
FundebugHttp.prototype.log = function (level, msg, meta, callback) {
  var self = this;
  
  if (typeof meta === 'function') {
    callback = meta;
    meta = {};
  }

  var options = {
    message: msg,
    notifierVersion: null,
    severity: level
  }

  if (level === 'error') {
    options.name = 'Error'
    options.stacktrace = meta.stack
    options.type = 'caughtError'
  } else if (level === 'info' || level === 'log' || level === 'warn' 
    || level === 'verbose' || level === 'debug' ) {
    options.name = msg
    options.type = 'notification'
  }


  var _options = Object.assign({}, options, {
    server        : this.server,
    appVersion    : this.appVersion,
    releaseStage  : this.releaseStage,
    apikey        : this.apikey,
    releaseStage  : this.releaseStage,
    appVersion    : this.appVersion,
    metaData      : this.metaData,
    user          : this.user
  })

  this._request(_options, function (err, res) {
    if (res && res.statusCode !== 200) {
      err = new Error('HTTP Status Code: ' + res.statusCode);
    }

    if (err) return callback(err);

    // TODO: emit 'logged' correctly,
    // keep track of pending logs.
    self.emit('logged');

    if (callback) callback(null, true);
  });
};