const {post, get} = require('../wx3rdApi')
const {defaultArgs} = require('../defaultArgs')

export const InfoTypes = {
  UNAUTHORIZED: 'unauthorized',
  AUTHORIZED: 'authorized',
  UPDATEAUTHORIZED: 'updateauthorized',
  COMPONENT_VERIFY_TICKET: 'component_verify_ticket'
};

/**
 * 参数说明：
 * 参数	是否必须	说明
 * component_appid  是	第三方平台APPID
 * offset	        是	偏移位置/起始位置
 * count            是	拉取数量，最大为500
 * 正常情况下，会返回：
 * {
 *    total_count: 33,
 *    list: [
 *		 {
 *			   "authorizer_appid": "authorizer_appid_1",
 *			   "refresh_token": "refresh_token_1",
 *			   "auth_time": auth_time_1
 *		  },
 *		  {
 *			   "authorizer_appid": "authorizer_appid_2",
 *			   "refresh_token": "refresh_token_2",
 *			   "auth_time": auth_time_2
 *		   }
 *    ]
 * }
 */
export const getAuthorizerList = defaultArgs(function (componentAppid, componentAccessToken, offset, count) {
	return post(`/api_get_authorizer_list?component_access_token=${componentAccessToken}`, {
		component_appid: componentAppid,
		offset,
		count
    })
});


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
export const wxGetComponentToken = defaultArgs(function (componentAppid, componentAppSecret, verifyTicket) {
  return post('/api_component_token', {
    component_appid: componentAppid,
    component_appsecret: componentAppSecret,
    component_verify_ticket: verifyTicket
  })
});

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
export const wxGetPreAuthCode = defaultArgs(function (componentAppid, accessToken) {
  return post(`/api_create_preauthcode?component_access_token=${accessToken}`, {
    component_appid: componentAppid
  })
});

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
export const wxQueryAuth = defaultArgs(function (componentAppid, accessToken, authCode) {
  return post(`/api_query_auth?component_access_token=${accessToken}`, {
    component_appid: componentAppid,
    authorization_code: authCode
  })
});

export const wxGetAuthorizeUrl = defaultArgs(function (componentAppid, authCode, redirectUri) {
  return `https://mp.weixin.qq.com/cgi-bin/componentloginpage?component_appid=${componentAppid}&pre_auth_code=${authCode}&redirect_uri=${encodeURIComponent(redirectUri)}`
});

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
export const wxRefreshApiAuthorizerToken = defaultArgs(function (componentAppid, componentAccessToken, authorizerAppid, authorizerRefreshToken) {
  return post(`/api_authorizer_token?component_access_token=${componentAccessToken}`, {
    component_appid: componentAppid,
    authorizerAppid,
    authorizerRefreshToken
  })
});

// 获取小程序详细信息
/**
 * 接口调用请求说明
 * http请求方式: POST（请使用https协议）
 * https://api.weixin.qq.com/cgi-bin/component/api_get_authorizer_info?component_access_token=xxxx
 * POST数据示例:
 * {
 *  "component_appid":"appid_value" ,
 *  "authorizer_appid": "auth_appid_value" 
 * }
 * 请求参数说明
 * 参数             说明
 * component_appid 服务appid
 * authorizer_appid  授权方appid
 * 
 * 
 * 返回结果示例：
 * {
 *      "authorizer_info": {
 *      "nick_name": "微信SDK Demo Special", 
 *      "head_img": "http://wx.qlogo.cn/mmopen/GPy", 
 *      "service_type_info": { "id": 2 }, 
 *      "verify_type_info": { "id": 0 },
 *      "user_name":"gh_eb5e3a772040",
 *      "principal_name":"腾讯计算机系统有限公司",
 *      "business_info": {"open_store": 0, "open_scan": 0, "open_pay": 0, "open_card": 0, "open_shake": 0},
 *      "qrcode_url":"URL",
 *      "signature": "时间的水缓缓流去",
 *      "miniprograminfo": {
 *       "network": {
 *            "requestdomain": ["https://www.qq.com", "https://www.qq.com"],
 *            "wsrequestdomain": ["wss://www.qq.com", "wss://www.qq.com"],
 *            "uploaddomain": ["https://www.qq.com", "https://www.qq.com"],
 *            "downloaddomain": ["https://www.qq.com","https://www.qq.com"]
 *        },
 *        "categories": [
 *            {"first":"资讯", "second":"文娱"},
 *            {"first":"工具", "second":"天气"}
 *        ],
 *        "visit_status": 0,
 *      }
 *    },
 *    "authorization_info": {
 *    "appid": "wxf8b4f85f3a794e77", 
 *    "func_info": [
 *      { "funcscope_category": { "id": 17 } }, 
 *      { "funcscope_category": { "id": 18 } }, 
 *      { "funcscope_category": { "id": 19 } }
 *    ]
 *   }
 * }
 * 返回参数说明
 * 参数                 说明
 * nick_name            授权方昵称
 * head_img             授权方头像
 * service_type_info    默认为0
 * verify_type_info     授权方认证类型，-1代表未认证，0代表微信认证
 * user_name            小程序的原始ID
 * signature            帐号介绍
 * principal_name       小程序的主体名称
 * business_info        用以了解以下功能的开通状况（0代表未开通，1代表已开通）：
 * open_store           是否开通微信门店功能
 * open_scan            是否开通微信扫商品功能
 * open_pay             是否开通微信支付功能
 * open_card            是否开通微信卡券功能
 * open_shake           是否开通微信摇一摇功能
 * qrcode_url           二维码图片的URL，开发者最好自行也进行保存
 * authorization_info   授权信息
 * appid                授权方appid
 * miniprograminfo      可根据这个字段判断是否为小程序类型授权
 * network              小程序已设置的各个服务器域名
 * func_info            小程序授权给开发者的权限集列表，ID为17到19时分别代表：
 * 
 * 17.帐号管理权限
 * 18.开发管理权限
 * 19.客服消息管理权限
 * 请注意：
 * 1）该字段的返回不会考虑小程序是否具备该权限集的权限（因为可能部分具备）
 **/
export const wxGetAuthorizerInfo = defaultArgs(function (componentAppid, authorizerAppid, componentAccessToken) {
  return post(`/api_get_authorizer_info?component_access_token=${componentAccessToken}`, {
    component_appid: componentAppid,
    authorizer_appid: authorizerAppid
  })
});

export const wxGetCategory = defaultArgs(function (accessToken) {
  return get(`/get_category?access_token=${accessToken}`)
});