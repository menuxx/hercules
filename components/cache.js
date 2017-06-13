// 令牌 db index
const redis = require('./redis')({dbIndex: 2})
const {log, errorlog} = require('../logger')('cache')
const {assign} = require('lodash')

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
  return putObject(`component_cache`, obj)
}

export const componentCacheGet = function () {
  return getObject(`component_cache`)
}

export const tokenCache = {
  getPreAuthCode: function() {
    return componentCacheGet().then(function (data) {
      return data.pre_auth_code
    })
  },
  getComponentAccessToken: function() {
    return componentCacheGet().then(function (data) {
      return data.component_access_token
    })
  }
}

// authorizer_appid, authorizer_access_token, authorizer_refresh_token

export const authorizerCache = {
  putAuthorizerInfo: function (appId, authorizerInfo) {
    return putObject(`${appId}:authorizer_info`, authorizerInfo)
  },
  getAuthorizerInfo: function (appId) {
    return getObject(`${appId}:authorizer_info`)
  },
  putRefreshTokenMsgId: function(appId, msgId) {
    var self = this;
    return self.getAuthorizerInfo(appId).then(function(info) {
      return self.putAuthorizerInfo(appId, assign(info, { refresh_token_msg_id: msgId }))
    })
  },
  getRefreshTokenMsgId: function(appId) {
    return this.getAuthorizerInfo(appId).then(function(info) {
      return info.refresh_token_msg_id
    })
  }
}




















