// https://github.com/request/request-promise
const rp = require('request-promise')
const apierror = require('debug')('wxapi:error')
const log = require('debug')('wxapi')

const baseApi = 'https://api.weixin.qq.com/cgi-bin'

export const get = function(apiUrl) {
  var fullUrl = baseApi + apiUrl
  log('weixin component request url: %s, body: %o', fullUrl, body)
  return rp({
    method: 'GET',
    uri: fullUrl,
    json: true
  })
  .then(function(res) {
    log('weixin component response url: %s, body %o', fullUrl, res)
    return res
  })
  .catch(function(err) {
    apierror('wxapi %s', fullUrl, err)
  })
}

export const post = function(apiUrl, body) {
  var fullUrl = baseApi + apiUrl
  log('weixin component request url: %s, body: %o', fullUrl, body)
  return rp({
    method: 'POST',
    uri: fullUrl,
    body: body,
    json: true
  })
  .then(function(res) {
    log('weixin component response url: %s, body: %o', fullUrl, res)
    return res
  })
  .catch(function(err) {
    apierror('wxapi %s', fullUrl, err)
  })
}