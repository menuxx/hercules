const {post, get} = require('./baseApi')
/**
 * 第三方平台compoment_access_token是第三方平台的下文中接口的调用凭据，
 * 也叫做令牌（component_access_token）。
 * 每个令牌是存在有效期（2小时）的，
 * 且令牌的调用不是无限制的，请第三方平台做好令牌的管理，
 * 在令牌快过期时（比如1小时50分）再进行刷新。
 *
 * 参数  说明
 * component_appid 第三方平台appid
 * component_appsecret 第三方平台appsecret
 * component_verify_ticket 微信后台推送的ticket，此ticket会定时推送，具体请见本页的推送说明
 * 
 * 返回结果示例
 * {
 *  "component_access_token": "61W3mEpU66027wgNZ_MhGHNQDHnFATkDa9-2llqrMBjUwxRSNPbVsMmyD-yq8wZETSoE5NQgecigDrSHkPtIYA", 
 *  "expires_in": 7200
 * }
 **/
export const wxGetComponentToken = function (appId, appSecret, verifyTicket) {
  return post('/component/api_component_token', {
    component_appid: appId,
    component_appsecret: appSecret,
    component_verify_ticket: verifyTicket
  })
}

/**
 * 该API用于获取预授权码。预授权码用于公众号或小程序授权时的第三方平台方安全验证。
 * 
 * 参数 说明
 * component_appid 第三方平台方appid
 *
 * 返回结果示例
 * {
 *  "pre_auth_code":"Cx_Dk6qiBE0Dmx4EmlT3oRfArPvwSQ-oa3NL_fwHM7VI08r52wazoZX2Rhpz1dEw",
 *  "expires_in":600
 * }
 */
export const wxGetPreAuthCode = function (appId, accessToken) {
  return post(`/component/api_create_preauthcode?component_access_token=${accessToken}`, {
    component_appid: appId
  })
}

/**
* 使用授权码换取公众号或小程序的接口调用凭据和授权信息
* 该API用于使用授权码换取授权公众号或小程序的授权信息，并换取authorizer_access_token和authorizer_refresh_token。 
* 授权码的获取，需要在用户在第三方平台授权页中完成授权流程后，在回调URI中通过URL参数提供给第三方平台方。
* 请注意，由于现在公众号或小程序可以自定义选择部分权限授权给第三方平台，
* 因此第三方平台开发者需要通过该接口来获取公众号或小程序具体授权了哪些权限，
* 而不是简单地认为自己声明的权限就是公众号或小程序授权的权限。
* 
* 参数  说明
* component_appid 第三方平台appid
* authorization_code  授权code,会在授权成功时返回给第三方平台，详见第三方平台授权流程说明
*/
export const wxQueryAuth = function (appId, accessToken, authCode) {
  return post(`/component/api_query_auth?component_access_token=${accessToken}`, {
    component_appid: appId,
    authorization_code: authCode
  })
}

export const wxGetAuthorizeUrl = function (appId, pre_auth_code, redirect_uri) {
  return `https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${appId}&pre_auth_code=${pre_auth_code}&redirect_uri=${encodeURIComponent(redirect_uri)}`
}

/** 
 * 获取（刷新）授权公众号或小程序的接口调用凭据（令牌）
 * 接口调用请求说明
 * http请求方式: POST（请使用https协议）
 * https:// api.weixin.qq.com /cgi-bin/component/api_authorizer_token?component_access_token=xxxxx
 * POST数据示例:
 * {
 *    "component_appid":"appid_value",
 *    "authorizer_appid":"auth_appid_value",
 *    "authorizer_refresh_token":"refresh_token_value",
 * }
 * 
 * 返回结果示例
 * {
 *    "authorizer_access_token": "aaUl5s6kAByLwgV0BhXNuIFFUqfrR8vTATsoSHukcIGqJgrc4KmMJ-JlKoC_-NKCLBvuU1cWPv4vDcLN8Z0pn5I45mpATruU0b51hzeT1f8", 
 *    "expires_in": 7200, 
 *    "authorizer_refresh_token": "BstnRqgTJBXb9N2aJq6L5hzfJwP406tpfahQeLNxX0w"
 * }
 * 参数 说明
 * authorizer_access_token 授权方令牌
 * expires_in  有效期，为2小时
 * authorizer_refresh_token  刷新令牌
 */
export const wxRefreshApiAuthorizerToken = function (appId, component_access_token, authorizer_appid, authorizer_refresh_token) {
  return post(`/component/api_authorizer_token?component_access_token=${component_access_token}`, {
    component_appid: appId,
    authorizer_appid,
    authorizer_refresh_token
  })
}





