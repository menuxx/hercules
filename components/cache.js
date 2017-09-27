// 令牌 db index
const redis = require('./redis')({dbIndex: 9})
const {log} = require('../logger')('cache')
const {wxOpen} = require('../config')

function getObject(key) {
  return redis.getAsync(key).then(function(data){
    log('cache get key: %s, value: %o', key, data)
    return JSON.parse(data)
  })
}

function putObject(key, obj) {
  log('cache put key: %s, value: %o', key, obj)
  return redis.setAsync(key, JSON.stringify(obj))
}

export const componentCacheSave = function (obj) {
  return putObject(`component_token:${wxOpen.appid}`, obj)
}

export const componentCacheGet = function () {
  return getObject(`component_token:${wxOpen.appid}`)
}

export const tokenCache = {
  getComponentAccessToken: function() {
    return componentCacheGet().then(function (data) {
      return data.component_access_token
    })
  }
}

// authorizer_appid, authorizer_access_token, authorizer_refresh_token
export const authorizerCache = {
  putAuthorization: function (appId, authorizationInfo) {
    return putObject(`authorizer_token:${appId}`, authorizationInfo)
  },
  getAuthorization: function (appId) {
    return getObject(`authorizer_token:${appId}`)
  }
}




















