const rp = require('request-promise');
const {isEmpty} = require('lodash');
const {getAuthorizerUrl, putAuthorizerUrl} = require('../config').urls;
const qs = require('querystring');
const wxliteApi = require('../wxlite');
const {dinerApi} = require('../leancloud')

// { appid: 'h4cjm2dncb3bqp9ncuqgw', 'appkey': 'cwjdkmcvnwqc753804uqnvgwnq3[94prvt' }
exports.getAuthorizerBy = function (by) {
  return rp({
    method: 'GET',
    uri: getAuthorizerUrl + '?' + qs.stringify(by),
    json: true
  }).then(function (res) {
    if (isEmpty(res)) {
      return Promise.reject(new Error('shop not found'));
    }
    return res;
  })
};

exports.putAuthorizerBy = function (webNotifyFn, by, data) {
  return webNotifyFn(putAuthorizerUrl + '?' + qs.stringify(by), data);
};

exports.toggleVisible = function (authorizerAppid) {
  return dinerApi.getAuthorizerByAppid(authorizerAppid)
      .then(function (diner) {
        return wxliteApi.changeVisit(authorizerAppid, !diner.visible).then(function () {
          return !diner.visible
        })
      })
      .then(function (visible) {
          return dinerApi.putAuthorizerFieldByAppid(authorizerAppid, 'visible', visible).then(function () {
            return visible
          })
      })
}

exports.fetchAuthorizer = require('./fetchAuthorizer');

exports.menuxx = require('./menuxx');