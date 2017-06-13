const rp = require('request-promise');
const {isEmpty} = require('lodash');
const {getAuthorizerUrl, putAuthorizerUrl} = require('../config').urls;
const qs = require('querystring');

// { appid: 'h4cjm2dncb3bqp9ncuqgw', 'appkey': 'cwjdkmcvnwqc753804uqnvgwnq3[94prvt' }
exports.getAuthorizerBy = function (by) {
  return rp({
    method: 'GET',
    uri: getAuthorizerUrl + '?' + qs.stringify(by),
    json: true
  }).then(function (res) {
    if (isEmpty(res)) {
      return Promise.reject(new Error('diner not found'));
    }
    return res;
  })
};

exports.putAuthorizerBy = function (webNotifyFn, by, data) {
  return webNotifyFn(putAuthorizerUrl + '?' + qs.stringify(by), data);
};

exports.fetchAuthorizer = require('./fetchAuthorizer');

exports.menuxx = require('./menuxx');