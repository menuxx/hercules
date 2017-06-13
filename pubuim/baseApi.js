// 文档位置 https://booteam.pubu.im/apps/integrations/59283d44a059285529eadc00
const rp = require('request-promise')
const {log, errorlog} = require('../logger')('pubuim')
// 使用 pubu.im 做消息发布
const apiUrl = 'https://hooks.pubu.im/services/nkweqg711p27cwp'

/**
 *
 * {
 *  "text": "文本",
 *  "channel": "#频道名字 或 @用户名字",
 *  "photoUrl": "图片 URL",
 *  "attachments": [{
 *    "title": "标题",
 *    "description": "描述",
 *    "url": "链接",
 *    "color": "warning|info|primary|error|muted|success"
 *  }],
 *  "displayUser": {
 *    "name": "应用名称",
 *    "avatarUrl": "头像地址"
 *  },
 *  "buttons": [
 *   {
 *     "text": "button label",
 *     "url": "http://domain.com/foo.html",
 *     "action": "action_1",
 *     "callbackUrl": "http://foo.dev/inline-button-handler"
 *   }
 *  ]
 * }
 * 
 * displayUser.name 如果为空, 整个 displayUser 将被判定为无效
 * attachments 数组最多支持 10 个元素
 * attachments 的 title 或 url 不能为空, 其它字段可选
 * 每个接入调用限制为每秒 10 次
 * 
 * 参数说明
 * channelString
 * 消息的目标频道可用通过传入channel参数修改，支持两种模式：#频道标题和@联系人名字。大小写需完全一致
 * 传入channel时，无论频道是否存在，将会忽略发送到频道中的设置；如果频道不存在，将会抛出500错误。
 * 
 * photoUrlString
 * 此参数用于将指定的图片 URL 下载并上传到零信服务器。
 * 当此参数存在时，以下参数将会被忽略：text、attachments、description。
 * 大小限制为4 MB以内。
 * 
 * buttonsArray
 * 用于生成可交互的 Inline buttons。
 * 此参数为包含 JSON 数据对象的数组，JSON 数据可包含：
 * 
 * text按钮的文本内容
 * 
 * url点击按钮后用新窗口打开的 URL。若url和action、callbackUrl同时存在，将优先处理url。
 * 
 * action点击按钮后触发的 action，将会以POST请求传递给callbackUrl
 * 
 * callbackUrl和action组合一起使用。
 **/

export const post = function (data) {
  log('send text: %s, channel: %s', data.text, data.channel)
    console.dir(data)
  return rp({
    uri: apiUrl,
    method: 'POST',
    body: data,
    json: true
  })
}

// 发送简单的文本信息
export const sendSimpleTextMsg = function (text, user, avatarUrl) {
  return post({
    "text": text,
    "displayUser": {
      "name": user,
      avatarUrl
    }
  })
}




