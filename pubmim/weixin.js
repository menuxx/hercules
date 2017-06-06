
const {siteUrl} = require('../config').server
const {post} = require('./baseApi')

var wxAvatarUrl = "https://file.menuxx.com/image/weixin-logo.png?imageView2/0/w/100/h/100"

// 发送块信息
/**
* {
*  "text": "芝根芝底披萨审核失败",
*  "channel": "#菜单加",
*  "attachments": [{
*    "title": "审核失败",
*    "description": "1:账号信息不符合规范:\n(1):包含色情因素\n2:服务类目\"金融业-保险_\"与你提交代码审核时设置的功能页面内容不一致:\n(1):功能页面设置的部分标签不属于所选的服务类目范围。\n(2):功能页面设置的部分标签与该页面内容不相关。\n",
*    "url": "https://pypi.python.org/pypi/paho-mqtt/1.1",
*    "color": "error"
*  }],
*  "displayUser": {
*    "name": "微信审核",
*    "avatarUrl": "https://file.menuxx.com/image/weixin-logo.png?imageView2/0/w/100/h/100"
*  }
* }
**/

/**
 * 代码提交成功完成信息
 */
export const sendCodeCommitOk = function ({codeVersion, templateId}, shopName, appId, qrCodeUrl) {
  return post({
    text: `代码提交成功。${shopName}[AppId: ${appId}], 扫描下方二维码可以预览\n\n 代码版本：${codeVersion} \n 小程序模板ID: ${templateId}`,
    photoUrl: qrCodeUrl,
    channel: "#微信",
    displayUser: {
      name: '微信小程序',
      avatarUrl: wxAvatarUrl
    },
    buttons: [
      {
        text: '提交微信审核',
        action: 'wxlite_submit_audit',
        callbackUrl: siteUrl + `api/diners/${appId}/code`
      }
    ]
  })
}

/**
 * 代码发布成功信息
 */
export const sendCodeReleaseOK = function ({codeVersion, templateId}, shopName, appId) {
  return post({
    text: `代码发布成功。${shopName}[AppId: ${appId}]，已完成上线\n\n 代码版本：${codeVersion} \n 小程序模板ID: ${templateId}`,
    channel: "#微信",
    displayUser: {
      name: '微信小程序',
      avatarUrl: wxAvatarUrl
    }
  })
}

/**
 * 代码审核失败信息
 */
export const sendCodeAuditFail = function ({codeVersion, templateId}, shopName, appId, reason) {
  return post({
    text: `代码审核没有通过。${shopName}[AppId: ${appId}], 具体原因见详情\n\n 代码版本：${codeVersion} \n 小程序模板ID: ${templateId}`,
    channel: "#微信",
    attachments: [{
      "title": "代码审核失败",
      "description": reason,
      "color": "error"
    },
    displayUser: {
      name: '微信小程序',
      avatarUrl: wxAvatarUrl
    }
  })
}

/**
 * 代码审核成功信息
 */
export const sendCodeAuditSuccess = function ({codeVersion, templateId}, shopName, appId) {
  return post({
    text: `代码审核通过。${shopName}[AppId: ${appId}]。\n\n 代码版本：${codeVersion} \n 小程序模板ID: ${templateId}`,
    channel: "#微信",
    displayUser: {
      name: '微信小程序',
      avatarUrl: wxAvatarUrl
    },
    buttons: [
      {
        text: '上线小程序',
        action: 'wxlite_code_release',
        callbackUrl: siteUrl + `api/diners/${appId}/code`
      }
    ]
  })
}


