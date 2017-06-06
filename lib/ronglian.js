const {md5, base64} = require('../lib/encrypt')
const log = require('debug')('ronglian')
const errorlog = require('debug')('ronglian:error')
const {timestamp, timeformat} = require('../lib/date')
const rp = require('request-promise')

const baseUri = 'https://app.cloopen.com:8883/2013-12-26/Accounts/{accountSid}/'

var _accountSid, _authToken

const post = function (uri, data) {
  var datetime = timeformat('YYYYMMDDHHmmss')
  /**
   * REST API 验证参数，生成规则如下
   * 1.使用MD5加密（账户Id + 账户授权令牌 + 时间戳）。其中账户Id和账户授权令牌根据url的验证级别对应主账户。
   * 时间戳是当前系统时间，格式"yyyyMMddHHmmss"。时间戳有效时间为24小时，如：20140416142030
   * 2.SigParameter参数需要大写，如不能写成sig=abcdefg而应该写成sig=ABCDEFG
   */
  log('accountSid: %s, authToken: %s, datetime: %s', _accountSid, _authToken, datetime)
  var sigParameter = md5(_accountSid + _authToken + datetime).toUpperCase()
  log('sign %s', sigParameter)
  /**
   * 验证信息，生成规则详见下方说明
   * 1.使用Base64编码（账户Id + 冒号 + 时间戳）其中账户Id根据url的验证级别对应主账户
   * 2.冒号为英文冒号
   * 3.时间戳是当前系统时间，格式"yyyyMMddHHmmss"，需与SigParameter中时间戳相同。
   */
  var fullUrl = baseUri.replace('{accountSid}', _accountSid) + uri + '?sig=' + sigParameter
  var authorize = base64(_accountSid + ':' + datetime)
  return rp({
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json;charset=utf-8',
      'Authorization': authorize
    },
    body: data,
    uri: fullUrl,
    json: true
  })
}

const sendSMS = function (to, appId, templateId, datas) {
  log('sendSMS to: %s, appId: %s, templateId: %s, datas: %o', to, appId, templateId, datas)
  return post('SMS/TemplateSMS', {
    to,
    appId,
    templateId,
    datas
  })
  .catch(function (err) {
    errorlog('send error', err)
  })
}

module.exports = function ({appId, accountSid, authToken}) {
  _accountSid = accountSid
  _authToken = authToken
  return {
    sendSMS(to, templateId, datas) {
      return sendSMS(to, appId, templateId, datas)
    }
  }
}
