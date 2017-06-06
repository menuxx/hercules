const {ronglian} = require('../config')
const RongLianSMS = require('../lib/ronglian')

const sms = RongLianSMS(ronglian)

// 180107 小程序授权更新成功
const UPDATEAUTHORIZED_templateId = 180123

// 180105 小程序解除授权
const UNAUTHORIZED_templateId = 180124

// 180104 小程序授权通过
const AUTHORIZED_templateId = 180104

//尊敬的{1}，您的小程序{2}已经成功授权到我们平台托管，感谢您的支持！
export const sendAuthorizedSMS = function (to, datas) {
  return sms.sendSMS(to, AUTHORIZED_templateId, datas)
}

//尊敬的{1}，您的小程序{2}已经更新授权成功，如有疑问请拨打{3}
export const sendUpdateauthorizedSMS = function (to, datas) {
  return sms.sendSMS(to, UPDATEAUTHORIZED_templateId, datas)
}

//尊敬的{1}，您的小程序{2}已经从我们平台解除授权绑定，如有疑问请拨打{3}
export const sendUnauthorizedSMS = function (to, datas) {
  return sms.sendSMS(to, UNAUTHORIZED_templateId, datas)
}