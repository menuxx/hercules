const {isEmpty} = require('lodash')
const {Router} = require('express')
const {xmlbodyparser} = require('../components/xml')
const wxerror = require('debug')('wxerror:error')
const log = require('debug')('wxlog')
// const {WXMsgRoute, WXNotifyHandler} = require('../wxnotify')
const {wxGetComponentToken, wxGetPreAuthCode} = require('../wxapi/componentApi')
const {componentCacheSave} = require('../components/cache')
// 平台配置
const {cachePublishPointers} = require('../config')
const {tokenCache, wxCache} = require('../components/cache')
const rp = require('request-promise')

const {saveEventLog} = require('../leancloud')

// 配置暂时放在这里，待稍后调整
const {appId, appSecret, appKey, token, encodingAESKey} = require('../config')
const {xmlparser} = require('../components/xml')
const WXBizMsgCrypt = require('wechat-crypto')
const wxCrypt = new WXBizMsgCrypt(token, encodingAESKey, appKey)

const route = Router()

route.use(xmlbodyparser)

var routes = []

/**
 *
 * 审核通过时，接收到的推送XML数据包示例如下：
 * <xml>
 *  <ToUserName><![CDATA[gh_fb9688c2a4b2]]></ToUserName>
 *  <FromUserName><![CDATA[od1P50M-fNQI5Gcq-trm4a7apsU8]]></FromUserName>
 *  <CreateTime>1488856741</CreateTime>
 *  <MsgType><![CDATA[event]]></MsgType>
 *  <Event><![CDATA[weapp_audit_success]]></Event>
 *  <SuccTime>1488856741</SuccTime>
 * </xml>
 * 
 * 参数说明：
 * 参数             说明
 * ToUserName     小程序的原始ID
 * FromUserName   发送方帐号（一个OpenID，此时发送方是系统帐号）
 * CreateTime     消息创建时间 （整型），时间戳
 * MsgType        消息类型，event
 * Event          事件类型 weapp_audit_success
 * SuccTime        审核成功时的时间（整形），时间戳
 **/
// routes.push(WXMsgRoute(
//   'MsgType=event&Event=weapp_audit_success', 
//   function (msg, req, resp) {

//   }
// ))

/**
* 审核不通过时，接收到的推送XML数据包示例如下：
* <xml>
*  <ToUserName><![CDATA[gh_fb9688c2a4b2]]></ToUserName>
*  <FromUserName><![CDATA[od1P50M-fNQI5Gcq-trm4a7apsU8]]></FromUserName>
*  <CreateTime>1488856591</CreateTime>
*  <MsgType><![CDATA[event]]></MsgType>
*  <Event><![CDATA[weapp_audit_fail]]></Event>
*  <Reason><![CDATA[1:账号信息不符合规范:<br>
*  (1):包含色情因素<br>
*    2:服务类目"金融业-保险_"与你提交代码审核时设置的功能页面内容不一致:<br>
*  (1):功能页面设置的部分标签不属于所选的服务类目范围。<br>
*  (2):功能页面设置的部分标签与该页面内容不相关。<br>
*  </Reason>
*  <FailTime>1488856591</FailTime>
* </xml>
*/
// routes.push(WXMsgRoute(
//   'MsgType=event&Event=weapp_audit_fail', 
//   function (msg, req, resp) {

//   }
// ))

// routes.push(WXMsgRoute(
//   'InfoType=component_verify_ticket', 
//   function (msg, req, resp) {

//   }
// ))


// routes.push(WXMsgRoute('InfoType=unauthorized'), 
//   function (msg, req, resp) {

// })

/**

 **/
// routes.push(WXMsgRoute('InfoType=authorized'), 
//   function (msg, req, resp) {

// })

/**

 **/
// routes.push(WXMsgRoute('InfoType=updateauthorized',
//   function (msg, req, resp) {

//   }
// ))


// 挂在到 route /3rd/notify 上
// .handler('/3rd/notify', route)

// route.post('/3rd/notify', WXNotifyHandler({ routes }))

// 微信第三方开放平台
route.post('/3rd/notify', function(req, resp) {
  var {signature, timestamp, nonce, encrypt_type, msg_signature} = req.query
  if (isEmpty(signature) || isEmpty(timestamp) || isEmpty(nonce) || isEmpty(encrypt_type) || isEmpty(msg_signature)) {
    wxerror('参数错误')
    return resp.status(401).send('FAIL:PARAMTERS_INVALID') 
  }
  var {encrypt} = req.body.xml
  var xmlMsg = wxCrypt.decrypt(encrypt).message
  var msgSignature = wxCrypt.getSignature(timestamp, nonce, encrypt)
  if (msg_signature !== msgSignature) {
    wxerror('签名错误')
    return resp.status(401).send('FAIL:SIGNATURE_INVALID')
  }
  //  { xml: 
  //    { AppId: 'wxb3d033d520d15fe7',
  //      CreateTime: '1496396219',
  //      InfoType: 'unauthorized',
  //      AuthorizerAppid: 'wxd101a85aa106f53e' 
  //    }
  //  }
  xmlparser.parseString(xmlMsg, function (err, result) {
    if (err) {
      wxerror('parse xml %s fail', xmlMsg, err)
      return resp.status(401).send('FAIL:XML_PARSE_FAIL')
    }
    console.log('--------------', result)
    var {ComponentVerifyTicket, MsgType} = result.xml
    if (MsgType === 'event') {
       saveEventLog(result.xml)
       return resp.send('SUCCESS')
    }
    else if (MsgType === 'text') {
      // https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419318611&lang=zh_CN
      // http://www.07net01.com/2017/01/1770019.html
      // 自动化测试的专用测试小程序的信息如下：
      //（1）appid：wxd101a85aa106f53e
      //（2）Username： gh_8dad206e9538
      var content = result.xml.Content
      var formOpenId = result.xml.FromUserName
      // wxCache.getAuthorizerInfo()
      // rp({
      //   method: 'PUT',
      //   uri: `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${}`
      // })
    }
    log('component_verify_ticket: ', ComponentVerifyTicket)
    // 解析完成之后就算成功
    resp.send('SUCCESS')
    // 先返回成功，剩下的工作继续处理 // 异步处理，相当一小型的队列
    wxGetComponentToken(appId, appSecret, ComponentVerifyTicket).then(function({component_access_token}) {
      log('component_access_token: ', component_access_token)
      return wxGetPreAuthCode(appId, component_access_token).then(function({pre_auth_code}) {
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
        }).catch(function(err){
          console.log(url, err.message)
        })
      })
    })
  })
})

route.all('/3rd/:appid/callback', function(req, resp) {
  resp.send('FAIL')
})


module.exports = route