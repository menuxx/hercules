/**
// 力士平台 代码提交审核
// routingKey: hercules.wxlite.code_submit_audit
// msg { authorizerAppid, version }
// 根据 appid 从 leancloud DinerWXLite Class 中提取 item_list
// 如果提取不到，就直接发送错误消息到 pubuim 并丢弃 该条审核消息
// 
// {
//  "item_list": [
//    {
//      "address": "index",
//      "tag": "学习 生活",
//      "first_class": "文娱",
//      "second_class": "资讯",
//      "title": "首页"
//    },
//    {
//      "address": "page/logs/logs",
//      "tag":"学习 工作",
//      "first_class": "教育",
//      "second_class": "学历教育",
//      "third_class": "高等",
//      "title": "日志"
//    }
//  ]
// }
//
// 参数说明
// 参数  说明
// access_token  
// 请使用第三方平台获取到的该小程序授权的authorizer_access_token
// item_list 提交审核项的一个列表（至少填写1项，至多填写5项）
// address 小程序的页面，可通过“获取小程序的第三方提交代码的页面配置”接口获得
// tag 小程序的标签，多个标签用空格分隔，标签不能多于10个，标签长度不超过20
// first_class 一级类目，可通过“获取授权小程序帐号的可选类目”接口获得
// second_class  二级类目(同上)                                                                               
// third_class 三级类目(同上)
// title 小程序页面的标题,标题长度不超过32
// 返回说明（正常时返回的json示例）：
// {
//      "errcode": 0,
//      "errmsg": "ok",
//      "auditid": 1234567
// }
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {log, errorlog} = require('../logger')('code_submit_audit');
const {createSimpleWorker} = require('../components/rabbitmq');
const {submitAuditLogApi, wxcodeApi} = require('../leancloud');
const {weixin} = require('../pubuim');
const wxlite = require('../wxlite');

const queueName = 'wxlite_submit_audit_queue';
const routingKey = ROUTING_KEYS.Hercules_WxliteSubmitAudit;

createSimpleWorker({queueName, routingKey}, function (msg) {
	let {authorizerAppid, version} = msg;
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	return Promise.all([
		wxlite.submitAudit(authorizerAppid),
		wxcodeApi.getByVersionNumber(version)
	]).then(function (res) {
		let {auditid} = res[0];	// submit_audit
		let {version, _objectId} = res[1];	// code
		/**
		 * {
		 *    auditid         :  5368259,   // 审核 id
		 *    version         :  '0.1.1',   // 发布版本号
		 *    authorizerAppid :  'wx833943b167b4012a',  // 账户 appid
		 *    codeId          :  '5937f6922f301e005884e565',  // 关联的 代码 id
		 * }
		 */
		return submitAuditLogApi.log({
			auditid,
			version,
			authorizerAppid,
			codeId: _objectId
		});
	}).then(function () {
		log('a worker done.')
	}, function (err) {
		errorlog(err);
	});
});
