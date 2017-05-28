// 消息队列任务
// 刷新 authorizer_refresh_token 
const {wxRefreshApiAuthorizerToken} = require('../wxapi/componentApi')
const {appId} = require('../config')
const {wxCache, tokenCache} = require('./cache')
const {assign} = require('lodash')

// msg = { appId, authorizer_appid, authorizer_refresh_token }
// appId 商家应用的appId
export const authorizerRefreshToken = function (msg) {
  return tokenCache.getComponentAccessToken().then(function (accessToken) {
    /**
    *  // wxRefreshApiAuthorizerToken 返回值
    *  {
    *    "authorizer_access_token": "aaUl5s6kAByLwgV0BhXNuIFFUqfrR8vTATsoSHukcIGqJgrc4KmMJ-JlKoC_-NKCLBvuU1cWPv4vDcLN8Z0pn5I45mpATruU0b51hzeT1f8", 
    *    "expires_in": 7200, 
    *    "authorizer_refresh_token": "BstnRqgTJBXb9N2aJq6L5hzfJwP406tpfahQeLNxX0w"
    *  }
    */
    // appId, component_access_token, authorizer_appid, authorizer_refresh_token
    return wxRefreshApiAuthorizerToken(appId, // component_app_id
      accessToken, msg.authorizer_appid, msg.authorizer_refresh_token)
  })
  // 获得新的 token 组
  .then(function({authorizer_access_token, authorizer_refresh_token}) {
    return wxCache.getAuthorizerInfo(msg.appId).then(function(info) {
      info.authorizer_access_token = authorizer_access_token
      info.authorizer_refresh_token = authorizer_refresh_token
      return assign({appId: msg.appId}, info)
    })
  })
  // 将新的令牌组 更新回缓存
  .then(function(authorizerInfo) {
    return wxCache.putAuthorizerInfo(msg.appId, authorizerInfo).then(function(){
      return authorizerInfo
    })
  })
}
