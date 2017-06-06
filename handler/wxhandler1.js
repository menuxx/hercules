const errorlog = require('debug')('wxhandler:error')
const log = require('debug')('wxhandler')
// doc : https://github.com/node-webot/wechat
const wechat = require('wechat')
const wxconfig = require('./config').wxOpen
// 平台配置
const {cachePublishPointers} = require('../config')
const {componentCacheGet, componentCacheSave} = require('../components/cache')
const {sendSMS} = require('../components/rabbitmq')
const sms = require('../ronglian')
const {isEmpty} = require('lodash')
const {Router} = require('express')
const wxapi = require('../wxapi')
const rp = require('request-promise')
const {InfoTypes} = wxapi

const route = Router()

// 验证 消息 api
// doc1 : https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419318611&lang=zh_CN
// doc2 : http://www.07net01.com/2017/01/1770019.html
// 第三方信息 Api 验证
/**
 * url :  /wx/3rd/wxd101a85aa106f53e/callback?
 *      signature=80f328952ca60312cc6eefe43e3913c3dfe92c60&
 *      timestamp=1496461028&nonce=1556906150&
 *      openid=oV6P70DM0-NBLoiQKb2JISwLhR80&encrypt_type=aes&
 *      msg_signature=79189b427da6755dd2240cca76304a57b9eb4880
 *      
 * msg :  
 * {
 *    ToUserName: 'gh_8dad206e9538',
 *    FromUserName: 'oV6P70DM0-NBLoiQKb2JISwLhR80',
 *    CreateTime: '1496461028',
 *    MsgType: 'text',
 *    Content: 'QUERY_AUTH_CODE:queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
 *    MsgId: '6427251175451672521'
 * }
 *
 * 自动化测试的专用测试小程序的信息如下：
 *（1）appid：wxd101a85aa106f53e
 *（2）Username： gh_8dad206e9538
 */

const WX_TEST_LITE_VERIFY_APPID = 'wxd101a85aa106f53e' // 微信小程序测试 AppId
const WX_TEST_LITE_USERNAME = 'gh_8dad206e9538' // 微信小程序测试 UserName

// 验证消息Api
// msg.ToUserName == WX_TEST_LITE_USERNAME
const verifyMsgApi = function (msg, resp) {
  var {Content} = msg
  var queryAuthCode = Content.replace('QUERY_AUTH_CODE:', '')
  return componentCacheGet()
  .then(function ({component_access_token}) {
    return wxapi.wxQueryAuth(wxconfig.appid, component_access_token, queryAuthCode)
  })
  .then(function (authorization_info) {
    var {authorizer_access_token} = authorization_info
    var sendContent = (queryAuthCode + '_from_api')
    resp.send('SUCCESS')
    return wxapi.sendText(authorizer_access_token, msg.FromUserName, sendContent)
  })
}

/**
 * doc : https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1453779503&token=&lang=zh_CN
 * 
 * url : /wx/3rd/notify?signature=0d565e505c560a4c1e5b814674182f68cfefbeb6
 *      &timestamp=1496461020&nonce=805459633&encrypt_type=aes
 *      &msg_signature=8e5a1cc3e9152f0f00fd0a50e568f3197474a1a2
 * msg : 
 *  {
 *    AppId: 'wxb3d033d520d15fe7',
 *    CreateTime: '1496461020',
 *    InfoType: 'authorized',
 *    AuthorizerAppid: 'wxd101a85aa106f53e',
 *    AuthorizationCode: 'queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
 *    AuthorizationCodeExpiredTime: '1496464620'
 *  }
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       authorized是授权成功通知
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 * 
 * 授权成功通知
 * <xml>
 *   <AppId>第三方平台appid</AppId>
 *   <CreateTime>1413192760</CreateTime>
 *   <InfoType>authorized</InfoType>
 *   <AuthorizerAppid>公众号appid</AuthorizerAppid>
 *   <AuthorizationCode>授权码（code）</AuthorizationCode>
 *   <AuthorizationCodeExpiredTime>过期时间</AuthorizationCodeExpiredTime>
 * </xml>
 **/
// 验证 - 授权验证 authorized
const verifyAuthorized = function (msg, resp) {
  resp.send('success')
}

/**
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       updateauthorized是更新授权
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 * 
 * 授权更新通知
 * <xml>
 *  <AppId>第三方平台appid</AppId>
 *  <CreateTime>1413192760</CreateTime>
 *  <InfoType>updateauthorized</InfoType>
 *  <AuthorizerAppid>公众号appid</AuthorizerAppid>
 *  <AuthorizationCode>授权码（code）</AuthorizationCode>
 *  <AuthorizationCodeExpiredTime>过期时间</AuthorizationCodeExpiredTime>
 * </xml>
 **/
// 验证 - 授权更新通知 updateauthorized
const verifyUpdateauthorized = function (msg, resp) {
  resp.send('success')
}

/**
 * 
 * url :  /wx/3rd/notify?signature=3e3913451936b865c9409e307fd5fa8d834108e6&timestamp=1496461034&nonce=2120938598&encrypt_type=aes&msg_signature=71d49f8eb081fd260406b7d7017c49f71dc9ee95
 * msg :  { AppId: 'wxb3d033d520d15fe7',
 * CreateTime: '1496461034',
 * InfoType: 'unauthorized',
 * AuthorizerAppid: 'wxd101a85aa106f53e' }
 * 
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       unauthorized是取消授权
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 * 取消授权通知
 * <xml>
 *  <AppId>第三方平台appid</AppId>
 *  <CreateTime>1413192760</CreateTime>
 *  <InfoType>unauthorized</InfoType>
 *  <AuthorizerAppid>公众号appid</AuthorizerAppid>
 * </xml>
 */
// 验证 - 取消授权通知 unauthorized
const verifyUnauthorized = function (msg, resp) {
  resp.send('success')
}

/**
 * url :  /wx/3rd/notify?signature=a5bd2c7f5ef89b5b18a703964157a96474a040ca&timestamp=1496461523&nonce=260040557&encrypt_type=aes&msg_signature=cab074cd1ed07bfecc9012b4912eb4249d9f958d
 * msg :  
 *  { 
 *    AppId: 'wxb3d033d520d15fe7',
 *    CreateTime: '1496461523',
 *    InfoType: 'component_verify_ticket',
 *    ComponentVerifyTicket: 'ticket@@@aglquGhXj06i8hOe_sTqW2enDJoI8pxH7xL-FcDOTbbjKLePiWEwr9kehVf5Oz6JDIlhk_BLsTuNw6Je-ifuVg'
 *  }
 * 
 * 处理微信第三方验证票据
 * 推送component_verify_ticket协议
 * 在第三方平台创建审核通过后，微信服务器会向其
 * “授权事件接收URL”每隔10分钟定时推送component_verify_ticket。
 * 第三方平台方在收到ticket推送后也需进行解密（详细请见【消息加解密接入指引】），接收到后必须直接返回字符串success。
 * POST数据示例
 * <xml>
 *   <AppId></AppId>
 *   <CreateTime>1413192605</CreateTime>
 *   <InfoType>component_verify_ticket</InfoType>
 *   <ComponentVerifyTicket></ComponentVerifyTicket>
 * </xml>
 * 
 * 字段说明
 * 字段名称                字段描述
 * AppId                 第三方平台appid
 * CreateTime            时间戳
 * InfoType              component_verify_ticket
 * ComponentVerifyTicket Ticket内容
 **/
const verifyComponentAccessToken = function (msg, resp) {
  resp.send('success')
}

// 处理微信第三方验证票据
const handleComponentAccessToken = function (msg, req, resp) {
  var {ComponentVerifyTicket} = msg
  var {appid, appSecret} = wxconfig
  wxapi.wxGetComponentToken(appid, appSecret, ComponentVerifyTicket)
  .then(function({component_access_token}) {
    log('component_access_token: ', component_access_token)
    return wxapi.wxGetPreAuthCode(appid, component_access_token).then(function({pre_auth_code}) {
      return {
        pre_auth_code, component_access_token
      }
    })
  })
  .then(function({component_access_token, pre_auth_code}) {
      log('pre_auth_code: ', pre_auth_code)
      var tokens = {
        component_verify_ticket: ComponentVerifyTicket, 
        pre_auth_code, 
        component_access_token
      }
      return componentCacheSave(tokens).then(function() {
        return tokens
      })
  })
  .then(function(cache) {
    log('put cache to publish pointers %o', cache)
    // 将缓存更新通知到所有注册的服务器
    cachePublishPointers.forEach(function(url) {
      rp({
        method: 'PUT',
        uri: url,
        body: cache,
        json: true
      }).catch(function(err) {
        errorlog('notify error %s, url %s', err.message, url)
      })
    })
  })
}

// 审核结果回调
const handleWeappAudit = function (msg, req, resp) {

}

// 授权事件接收URL
route.post('/3rd/notify', wechat(wxconfig, function (req, resp) {
  var msg = req.weixin
  switch (msg.InfoType) {
    // 取消授权
    case InfoTypes.UNAUTHORIZED:
      // 测试ID
      if (msg.AuthorizerAppid === WX_TEST_LITE_VERIFY_APPID) {
        return verifyUnauthorized(msg, resp)
      }
      sendSMSQ(msg.AuthorizerAppid, InfoTypes.UNAUTHORIZED)
      break;
    // 授权成功
    case InfoTypes.AUTHORIZED:
      // 测试ID
      if (msg.AuthorizerAppid === WX_TEST_LITE_VERIFY_APPID) {
        return verifyAuthorized(msg, resp)
      }

      sendSMSQ(msg.AuthorizerAppid, InfoTypes.AUTHORIZED)
      break;
    // 授权更新
    case InfoTypes.UPDATEAUTHORIZED:
      // 测试ID
      if (msg.AuthorizerAppid === WX_TEST_LITE_VERIFY_APPID) {
        return verifyUpdateauthorized(msg, resp)
      }
      sendSMSQ(msg.AuthorizerAppid, InfoTypes.UPDATEAUTHORIZED)
      break;
    // 验证票据
    case InfoTypes.COMPONENT_VERIFY_TICKET:
      handleComponentAccessToken(msg, req, resp)
      break;
    default:
  }
}))

// 公众号消息与事件接收URL
route.post('/3rd/:appid/callback', wechat(wxconfig, function (req, resp, next) {
  var {appid} = req.params
  var msg = req.weixin
  if (msg.ToUserName === WX_TEST_LITE_USERNAME) {
    return verifyMsgApi(msg, resp)
    .then(function(res) {
      log('verify ok')
    }, function (err) {
      errorlog('verify fail', err)
    })
  }
  resp.reply('客服消息正在开发中，敬请期待...')
})





















