// 代码管理
/**
 * 文档位置：https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1489140610_Uavc4&token=&lang=zh_CN
 * 第三方平台在开发者工具上开发完成后，可点击上传，代码将上传到开放平台草稿箱中，
 * 第三方平台可选择将代码添加到代码中，获得代码模版ID后，
 * 可调用以下接口进行代码管理。
 */
const {post, get, getfile, bindTesterErrorMsg} = require('../wxliteApi');
const {defaultArgs} = require('../defaultArgs');

/**
 * 1、为授权的小程序帐号上传小程序代码
 * https://api.weixin.qq.com/wxa/commit?access_token=TOKEN
 * POST数据示例:
 * {
 *   "template_id" : 0,
 *   "ext_json": "JSON_STRING", //ext_json需为string类型，请参考下面的格式
 *   "user_version": "V1.0",
 *   "user_desc": "test",
 * }
 * 参数说明:
 * 参数           说明
 * access_token   请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * template_id    代码库中的代码模版ID
 * ext_json       第三方自定义的配置
 * user_version   代码版本号，开发者可自定义
 * user_desc      代码描述，开发者可自定义
 *
 * 
 * 返回说明（正常时返回的json示例）：
 * {
 *  "errcode":0,
 *  "errmsg":"ok",
 * }
 * 错误码说明：
 * 返回码  说明
 * -1     系统繁忙
 * 85013  无效的自定义配置
 * 85014  无效的模版编号
 * 
 * 错误码说明：
 * 返回码 说明
 * -1    系统繁忙
 * 85001 微信号不存在或微信号设置为不可搜索
 * 85002 小程序绑定的体验者数量达到上限
 * 85003 微信号绑定的小程序体验者达到上限
 * 85004 微信号已经绑定
 */

export const wxCommit = defaultArgs(function(accessToken, templateId, extJson, version, desc) {
  return post(`commit?access_token=${accessToken}`, {
    template_id: templateId,
    ext_json: extJson,
    user_version: version,
    user_desc: desc
  })
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})

/**
 * 2、获取体验小程序的体验二维码
 * 
 * 请求方式: get
 * https://api.weixin.qq.com/wxa/get_qrcode?access_token=TOKEN
 * 
 * 参数说明
 * 参数           说明
 * access_token  请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * 
 * 
 * 返回说明（正确情况下的返回HTTP头如下）：
 * HTTP/1.1 200 OK
 * Connection: close
 * Content-Type: image/jpeg
 * Content-disposition: attachment; filename="QRCode.jpg"
 * Date: Sun, 06 Jan 2013 10:20:18 GMT
 * Cache-Control: no-cache, must-revalidate
 * Content-Length: 339721
 * 
 * 错误情况下的返回JSON数据包示例如下：
 * {
 *   "errcode": -1,
 *   "errmsg": "system error"
 * }
 */
export const wxGetQrcode = defaultArgs(function(accessToken) {
  return getfile(`get_qrcode?access_token=${accessToken}`);
})

/**
 * 3、获取授权小程序帐号的可选类目
 * 
 * 请求方式: get
 * https://api.weixin.qq.com/wxa/get_category?access_token=TOKEN
 * 
 * 参数说明
 * 参数           说明
 * access_token  请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * 
 * 返回说明（正常时返回的json示例）：
 * {
 *  "errcode":0,
 *  "errmsg": "ok",
 *  "category_list" : [
 *   {
 *     "first_class":"工具",
 *     "second_class":"备忘录"
 *   }
 *   {
 *     "first_class":"教育",
 *     "second_class":"学历教育",
 *     "third_class":"高等"
 *   }
 *  ]
 * }
 * 
 * 返回参数说明：
 * 参数             说明
 * category_list    可填选的类目列表
 * first_class      一级类目
 * second_class     二级类目
 * third_class      三级类目
 * 
 * 错误码说明：
 * 返回码  说明
 * -1     系统繁忙
 **/

export const wxGetCategory = defaultArgs(function(accessToken) {
  return get(`get_category?access_token=${accessToken}`)
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})

/**
* 4、获取小程序的第三方提交代码的页面配置（仅供第三方开发者代小程序调用）
* 请求方式: get
* url: https://api.weixin.qq.com/wxa/get_page?access_token=TOKEN
* 参数说明
* 参数            说明
* access_token    请使用第三方平台获取到的该小程序授权的authorizer_access_token
* 返回说明（正常时返回的json示例）：
* {
*   "errcode":0,
*   "errmsg":"ok",
*   "page_list":[
*     "index",
*     "page\/list",
*     "page\/detail"
*   ]
* }
* 
* 返回参数说明：
* 参数        说明
* page_list   page_list 页面配置列表
* 
* 
* 错误码说明：
* 返回码     说明
* -1        系统繁忙
* 86000     不是由第三方代小程序进行调用
* 86001     不存在第三方的已经提交的代码
**/

export const wxGetPage = defaultArgs(function(accessToken) {
  return get(`get_page?access_token=${accessToken}`)
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})

/**
* 5、将第三方提交的代码包提交审核（仅供第三方开发者代小程序调用）
* 请求方式: POST
* url: https://api.weixin.qq.com/wxa/submit_audit?access_token=TOKEN
* 
* POST数据示例:
* {
*   "item_list": [
*     {
*       "address":"index",
*       "tag":"学习 生活",
*       "first_class": "文娱",
*       "second_class": "资讯",
*       "title": "首页"
*     },
*     {
*       "address": "page/logs/logs",
*       "tag": "学习 工作",
*       "first_class": "教育",
*       "second_class": "学历教育",
*       "third_class": "高等",
*       "title": "日志"
*     }
*   ]
* }
* 参数说明
* 参数              说明
* access_token      请使用第三方平台获取到的该小程序授权的authorizer_access_token
* 返回说明（正常时返回的json示例）：
* {
*   "errcode":0,
*   "errmsg":"ok",
*   "page_list":[
*     "index",
*     "page\/list",
*     "page\/detail"
*   ]
* }
* 
* 返回参数说明：
* 参数        说明
* page_list   page_list 页面配置列表
* 
* 
* 错误码说明：
* 返回码     说明
* -1        系统繁忙
* 86000     不是由第三方代小程序进行调用
* 86001     不存在第三方的已经提交的代码
**/

export const wxSubmitAudit1 = defaultArgs(function (accessToken, itemList) {
  return post(`submit_audit?access_token=${accessToken}`, {
	  item_list: itemList
  })
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})

export const wxSubmitAudit = defaultArgs(function (accessToken, itemList) {
	return new Promise(function (resolve, reject) {
		resolve({
			errcode: 0,
			errmsg: 'ok',
			auditid: 15601
        });
    });
})

/**
 * 发布已通过审核的小程序（仅供第三方代小程序调用）
 * 请求方式: POST（请使用https协议）
 * https://api.weixin.qq.com/wxa/release?access_token=TOKEN
 *
 * POST数据示例:
 * { }
 *
 * 参数说明：
 * 请填写空的数据包，POST的json数据包为空即可。
 *
 * 返回说明（正常时返回的json示例）：
 * {
 *    "errcode":0,
 *    "errmsg":"ok",
 * }
 * 
 * 错误码说明：
 * 返回码       说明
 * -1          系统繁忙
 * 85019       没有审核版本
 * 85020       审核状态未满足发布
 **/
export const wxRelease = defaultArgs(function (accessToken) {
  return post(`release?access_token=${accessToken}`, {})
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
});

/**
 * 9、修改小程序线上代码的可见状态（仅供第三方代小程序调用）
 * 请求方式: POST（请使用https协议）
 * https://api.weixin.qq.com/wxa/change_visitstatus?access_token=TOKEN
 * 
 * POST数据示例:
 * {
 *    "action"="close"
 * }
 *
 * 参数说明:
 * 参数  说明
 * access_token  
 * 请使用第三方平台获取到的该小程序授权的authorizer_access_token
 * action  设置可访问状态，发布后默认可访问，close为不可见，open为可见
 *
 * 返回说明（正常时返回的json示例）：
 * {
 *   "errcode":0,
 *   "errmsg":"ok",
 * }
 * 
 * 错误码说明：
 * 返回码    说明
 * -1       系统繁忙
 * 85021    状态不可变
 * 85022    action非法
 */
export const wxChangeVisitStatus = defaultArgs(function (accessToken, isOpne) {
  var action = isOpne ? 'open' : 'close'
  return post(`change_visitstatus?access_token=${accessToken}`, {
    action
  })
  .catch(function(err) {
    err.errorMsg = bindTesterErrorMsg(err.errcode)
    return err
  })
})




