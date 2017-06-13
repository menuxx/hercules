// 账号管理
/**
 * 文档位置：https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1489138143_WPbOO&token=&lang=zh_CN
 * 
 * 授权给第三方的小程序，其服务器域名只可以为第三方的服务器，
 * 当小程序通过第三方发布代码上线后，小程序原先自己配置的服务器域名将被删除，
 * 只保留第三方平台的域名，所以第三方平台在代替小程序发布代码之前，
 * 需要调用接口为小程序添加第三方自身的域名。
 * 
 * 提示：需要先将域名登记到第三方平台的小程序服务器域名中，才可以调用接口进行配置。
 * 
 *
 *   参数说明
 *   参数  说明
 *   access_token 请使用第三方平台获取到的该小程序授权的authorizer_access_token
 *   action add添加, delete删除, set覆盖, get获取。当参数是get时不需要填四个域名字段。
 *   requestdomain  request合法域名，当action参数是get时不需要此字段。
 *   wsrequestdomain  socket合法域名，当action参数是get时不需要此字段。
 *   uploaddomain   uploadFile合法域名，当action参数是get时不需要此字段。
 *   downloaddomain   downloadFile合法域名，当action参数是get时不需要此字段。
 *
 *
 * 返回说明（正常时返回的json示例）：
 * {
 *    "errcode" : 0,
 *    "errmsg"  : "ok",
 *    //以下字段仅在get时返回
 *    "requestdomain":["https://www.qq.com","https://www.qq.com"],
 *    "wsrequestdomain":["wss://www.qq.com","wss://www.qq.com"],
 *    "uploaddomain":["https://www.qq.com","https://www.qq.com"],
 *    "downloaddomain":["https://www.qq.com","https://www.qq.com"],
 * }
 */
const {post} = require('../wxliteApi');
const {defaultArgs} = require('../defaultArgs');

const modifyDomain = function (action) {
  return defaultArgs(function(accessToken, requestDomains, wsRequestDomains, uploadDomains, downloadDomains) {
    return post(`modify_domain?access_token=${accessToken}`, {
      "action": action,
      "requestdomain": requestDomains,
      "wsrequestdomain": wsRequestDomains,
      "uploaddomain": uploadDomains,
      "downloaddomain": downloadDomains
    })
  })
};

function fwupper(str) {
	return str.substr(0, 1).toUpperCase() + str.substring(1);
}

// exports.wxSddDomain
// exports.wxDeleteDomain
// exports.wxSetDomain
// exports.wxGetDomain

['add', 'delete', 'set', 'get'].forEach(function(action){
  exports['wx' + fwupper(action) + 'Domain'] = modifyDomain(action)
})