const {post, get} = require('../wxApi')

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

// 主动发送文本消息
const _sendText = function (touser, content) {
  return {
    touser,
    msgtype: 'text',
    text: { content }
  }
}

export const wxSendText = function (accessToken, touser, content) {
  return post(`/message/custom/send?access_token=${accessToken}`, _sendText(touser, content))
}