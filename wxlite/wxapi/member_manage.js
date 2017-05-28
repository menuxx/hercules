// 成员管理
/**
 * 文档位置：https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1489140588_nVUgx&token=&lang=zh_CN
 * 第三方平台在帮助旗下授权的小程序提交代码审核之前，
 * 可先让小程序运营者体验，体验之前需要将运营者的个人微信号添加到该小程序的体验者名单中。
 * 
 * 注意：如果运营者同时也是该小程序的管理员，则无需绑定，管理员默认有体验权限。
 * 
 * 参数说明：
 * 参数           说明
 * access_token   请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * wechatid       微信号
 * 
 * 
 * 返回说明（正常时返回的json示例）：
 *  {
 *    "errcode": 0,
 *    "errmsg": "ok",
 *  }
 **/

const {post} = require('../wxapi')
const {defaultArgs} = require('./defaultArgs')

 /**
  * 1、绑定微信用户为小程序体验者
  */

/**
 * 错误码说明：
 * 返回码 说明
 * -1    系统繁忙
 * 85001 微信号不存在或微信号设置为不可搜索
 * 85002 小程序绑定的体验者数量达到上限
 * 85003 微信号绑定的小程序体验者达到上限
 * 85004 微信号已经绑定
 *
 */
export const errorMap = {
  '-1': '系统繁忙',
  '85001': '微信号不存在或微信号设置为不可搜索',
  '85002': '小程序绑定的体验者数量达到上限',
  '85003': '微信号绑定的小程序体验者达到上限',
  '85004': '微信号已经绑定'
}
export const bindTesterErrorMsg = function(errorCode) {
  var errMsg = errorMap[errorCode + ""]
  if (errMsg) {
    return errMsg
  }
  return '未知的错误'
}

export const bindTester = defaultArgs(function ({accessToken, wechatid}) {
  return post(`bind_tester?access_token=${accessToken}`, {
    wechatid
  })
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})


/**
 * 2、解除绑定小程序的体验者
 * 
 * 参数说明：
 * 参数           说明
 * access_token  请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * wechatid      微信号
 * 
 * 返回说明（正常时返回的json示例）：
 * {
 *  "errcode":0,
 *  "errmsg":"ok",
 * }
 * 
 * 错误码说明：
 * 返回码  说明
 * -1     系统繁忙
 */
export const unbindTester = defaultArgs(function({accessToken, wechatid}) {
  return post(`unbind_tester?access_token=${accessToken}`, {
    wechatid
  })
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})






