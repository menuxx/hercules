// https://github.com/request/request-promise
const rp = require('request-promise')
const debug = require('debug')

module.exports = function (moduleName, baseApi) {

  const apierror = debug(moduleName + ":error")
  const log = debug(moduleName)

  const get = function(apiUrl) {
    var fullUrl = baseApi + apiUrl
    log('weixin [%s] request url: %s, body: %o', moduleName, fullUrl, body)
    return rp({
      method: 'GET',
      uri: fullUrl,
      json: true
    })
    .then(function(res) {
      log('weixin [%s] response url: %s, body %o', moduleName, fullUrl, res)
      return res
    })
    .catch(function(err) {
      apierror('wxapi [%s] error', moduleName, fullUrl, err)
    })
  }

  const post = function(apiUrl, body) {
    var fullUrl = baseApi + apiUrl
    log('weixin %s request url: %s, body: %o', moduleName, fullUrl, body)
    return rp({
      method: 'POST',
      uri: fullUrl,
      body: body,
      json: true
    })
    .then(function(res) {
      log('weixin %s response url: %s, body: %o', moduleName, fullUrl, res)
      return res
    })
    .catch(function(err) {
      apierror('wxapi [%s] error', moduleName, fullUrl, err)
    })
  }
  return { post, get }
}