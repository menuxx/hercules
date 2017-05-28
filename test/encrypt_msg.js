const {appId, appSecret, appKey, token, encodingAESKey} = require('./config')
const WXBizMsgCrypt = require('wechat-crypto')
// https://github.com/Leonidas-from-XIV/node-xml2js
const parseString = require('xml2js').parseString
const {getComponentToken, getPreAuthCode} = require('./wxapi/componentApi')
const wxCrypt = new WXBizMsgCrypt(token, encodingAESKey, appKey)

const timestamp = '1495530352'
const nonce = '2080409900'
const encrypt = 'Rfi8IB+HadLNYcIDetRtoSOJbWfbggdfT82WT3AOr/t4GcNg+7H8ZT0orFPW4YD/XvRk7OshGofk52MSRP31BYDe6NnG0JIqAciNLgJv0qBqBGolMgHC2/ItDUfk5dc45dl6569JRln7r1oYSXndW223rz5jkU+47nC7onAT+/k/2I+KoQBrcNRIPEvp3a+MqAkdlL/Ej1nJX+HBawWfJh8AKz2C8Nv9c4ceGv6oqEyHX/I6PvgP5Okyed1hYQAWOcmdEOG2mro022PFkE3tkchrNPMVtWyTTUqpvR15GFWMDQBbEiU+VMVo9JNQyn8VcDq18y0A95Z5a+7tYSrRe7tG6UxI5YI2uEkLVCAVffhW+TaTfiVA5DMpZgxr/7EeCpBKZkm8kBKuCbZnsk2LkZOiwpMWCbHSwAAY8o18SbNyy0O/UsCKfa2QjB2jbCXKvN+W8eZfLlU0DpJum7pAUQ=='

var signature = wxCrypt.getSignature(timestamp, nonce, encrypt)

console.log('signature', signature)

var xmlMsg = wxCrypt.decrypt(encrypt).message

parseString(xmlMsg, function (err, result) {
    if (err) console.error(err)
    var {ComponentVerifyTicket} = result.xml
    console.log('ComponentVerifyTicket', ComponentVerifyTicket)
    getComponentToken(appId, appSecret, ComponentVerifyTicket).then(function(res) {
      var {errcode, errmsg} = res
      if (errcode) {
        console.error(errmsg)
      } else {
        var {component_access_token} = res
        console.log(res)
        console.log('component_access_token', component_access_token)
        return getPreAuthCode(appId, component_access_token)
      }
    }).then(function(res){
        console.log('PreAuthCode', res)
    })
})