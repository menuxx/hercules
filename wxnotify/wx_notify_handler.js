const log = require('debug')('wxnotifyhandler')
const errorlog = require('debug')('wxnotifyhandler:error')
const {xmlparser} = require('../components/xml')
const WXBizMsgCrypt = require('wechat-crypto')
const {appId, appSecret, appKey, token, encodingAESKey} = require('../config')

const wxCrypt = new WXBizMsgCrypt(token, encodingAESKey, appKey)

// 微信通知解析器
// 挂在到 route /3rd/notify 上
const WXNotifyHandler = function ({ routes }) {

  return function (req, resp, next) {

    if (isEmpty(req.body)) {
      errorlog('handler pre process handler xmlbodyparser')
      next(new Error('not exists xmlbodyparser'))
      return
    }

    log('handler url : %s, msg raw content : %o', req.url, req.body)

    var {signature, timestamp, nonce, encrypt_type, msg_signature} = req.query
    if (isEmpty(signature) || isEmpty(timestamp) || isEmpty(nonce) || isEmpty(encrypt_type) || isEmpty(msg_signature)) {
      errorlog('参数错误')
      return resp.status(401).send('FAIL:PARAMTERS_INVALID') 
    }

    var {encrypt} = req.body.xml
    var xmlMsg = wxCrypt.decrypt(encrypt).message
    var msgSignature = wxCrypt.getSignature(timestamp, nonce, encrypt)
    if (msg_signature !== msgSignature) {
      wxerror('签名错误')
      return resp.status(401).send('FAIL:SIGNATURE_INVALID')
    }
    xmlparser.parseString(xmlMsg, function (err, result) {
      if (err) {
        wxerror('parse xml %s fail', xmlMsg, err)
        return resp.status(401).send('FAIL:XML_PARSE_FAIL')
      }
      /**
       * { routingKey }
       */
      routes.forEach(function (route) {

        if ( route.match() ) {
          log('handler match route %s', route.name)
        }

      })
    })
  }
}

module.exports = WXNotifyHandler