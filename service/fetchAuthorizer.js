const {getAuthorizerUrl} = require('../config').urls
const rp = require('request-promise')
const {authorizerCache} = require('../components/cache')
const {dinerApi} = require('../leancloud')

// mode 1 2 4
// mode 1: 只获取 detail 从 getAuthorizerUrl
// mode 2: 只获取 auth 从缓存
// mode 4: 只获取 info 从微信

/**
* shopName
* masterName
* masterPhone
* appKey
* authorizerAppid
* authorizerStatus
* wxliteTemplateType
* wxliteVersion
* wxliteStatus
*/

const fetchAuthorizer = module.exports = function (authorizerAppid, mode=7) {

  var _get1 = function() {
    return rp({
      method: 'GET',
      uri: getAuthorizerUrl + '?appid=' + authorizerAppid,
      json: true
    })
  };

  var _get2 = function() {
    return authorizerCache.getAuthorizerInfo(authorizerAppid)
  };

  var _get3 = function() {
	  return dinerApi.getAuthorizerByAppid(authorizerAppid);
  };

  if (mode === 7) {
    return Promise.all([_get1(), _get2(), _get3()]).then(function (res) { return { appInfo: res[0], authInfo: res[1], dinerCode: res[2] } })
  }
  else if (mode === 1) {
    return Promise.all([_get1()]).then(function (res) { return { appInfo: res[0] }})
  }
  else if (mode === 3) {
    return Promise.all([_get1(), _get2()]).then(function (res) { return { appInfo: res[0], authInfo: res[1] } })
  } else if (mode === 6) {
    return Promise.all([_get1(), _get3()]).then(function (res) { return { appInfo: res[0], dinerCode: res[1] } })
  } else if (mode === 2) {
    return Promise.all([_get2()]).then(function (res) { return { authInfo: res[0] }})
  }
   else if (mode === 4) {
    return Promise.all([_get2()]).then(function (res) { return { dinerCode: res[0] }})
  }

  return null

}