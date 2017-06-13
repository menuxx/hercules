const express = require('express')
const app = express()
const wechat = require('wechat')
const bodyParser = require('body-parser')
const wxconfig = require('./config').weixin

/**
 
url :  /wx/3rd/notify?signature=0d565e505c560a4c1e5b814674182f68cfefbeb6&timestamp=1496461020&nonce=805459633&encrypt_type=aes&msg_signature=8e5a1cc3e9152f0f00fd0a50e568f3197474a1a2
msg :  { AppId: 'wxb3d033d520d15fe7',
  CreateTime: '1496461020',
  InfoType: 'authorized',
  AuthorizerAppid: 'wxd101a85aa106f53e',
  AuthorizationCode: 'queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
  AuthorizationCodeExpiredTime: '1496464620' }

// doc : https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419318611&lang=zh_CN

url :  /wx/3rd/wxd101a85aa106f53e/callback?signature=80f328952ca60312cc6eefe43e3913c3dfe92c60&timestamp=1496461028&nonce=1556906150&openid=oV6P70DM0-NBLoiQKb2JISwLhR80&encrypt_type=aes&msg_signature=79189b427da6755dd2240cca76304a57b9eb4880
msg :  { ToUserName: 'gh_8dad206e9538',
  FromUserName: 'oV6P70DM0-NBLoiQKb2JISwLhR80',
  CreateTime: '1496461028',
  MsgType: 'text',
  Content: 'QUERY_AUTH_CODE:queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
  MsgId: '6427251175451672521' }

url :  /wx/3rd/notify?signature=3e3913451936b865c9409e307fd5fa8d834108e6&timestamp=1496461034&nonce=2120938598&encrypt_type=aes&msg_signature=71d49f8eb081fd260406b7d7017c49f71dc9ee95
msg :  { AppId: 'wxb3d033d520d15fe7',
  CreateTime: '1496461034',
  InfoType: 'unauthorized',
  AuthorizerAppid: 'wxd101a85aa106f53e' }

 */

// app.use(express.query())

// app.post('/wx/3rd/notify', wechat(wxconfig, function (req, resp, next) {
//   console.log('url : ', req.url)
//   console.log('msg : ', req.weixin)
//   resp.send('SUCCESS')
// }))

// app.post('/wx/3rd/:appid/callback', wechat(wxconfig, function (req, resp, next) {
//   console.log('url : ', req.url)
//   console.log('msg : ', req.weixin)
//   resp.send('SUCCESS')
// }))

app.use(bodyParser.text({ type: 'text/xml' }))

app.post('/wx/3rd/notify', function (req, resp) {
  console.log('url : ', req.url)
  console.log('body', req.body)
  console.log('----------------------------')
  resp.send('ok')
})

app.post('/wx/3rd/:appid/callback', function (req, resp) {
  console.log('url : ', req.url)
  console.log('body', req.body)
  console.log('----------------------------')
  resp.send('ok')
})

app.listen(8081)

