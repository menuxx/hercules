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
const rabbitmq = require('../components/rabbitmq')();
const {shopApi, submitAuditLogApi, wxcodeApi} = require('../leancloud');
const wxlite = require('../wxlite')
const {pubuWeixin} = require('../pubuim')
const {isEmpty} = require("lodash")

const exchangeName = 'yth.rd3'
const delayExchangeName = 'yth.rd3.delay'
const queueName = 'wxlite_submit_audit_queue';
const routingKey = ROUTING_KEYS.Hercules_WxliteSubmitAudit;

var delayPublisherChannel = null

rabbitmq.createSimpleWorker({exchangeNames: [exchangeName, delayExchangeName], queueName, routingKey}, function (msg) {
	let {authorizerAppid, version, times} = msg;
	times = isEmpty(times) ? 1 : times
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	if (!isEmpty(authorizerAppid) && !isEmpty(version)) {
		return Promise.all([
			wxlite.submitAudit(authorizerAppid),
			wxcodeApi.getByVersionNumber(version),
			shopApi.getAuthorizerByAppid(authorizerAppid)
		]).then( (res) => {
			let audit = res[0];	// submit_audit
			let code = res[1];	// code
			let shop = res[2]
			// 没有产生 审核 id, 超过3次，丢弃该请求
			if (isEmpty(audit.auditid)) {
				if ( times > 3 ) {
					pubuWeixin.sendCodeSubmitAuditFail(shop.appName, authorizerAppid, audit.errmsg)
					return Promise.reject({ ok : false, status: false });
				} else {
					// 10 秒后重试
					rabbitmq.publishDelay(delayPublisherChannel, delayExchangeName, ROUTING_KEYS.Hercules_WxliteCodeRelease, {
						authorizerAppid,
						times
					}, 60 * times)
					// 丢弃当前消息
					return Promise.reject({ ok : false, status: false });
				}
			}
			/**
			 * {
			 *    auditid         :  5368259,   // 审核 id
			 *    version         :  '0.1.1',   // 发布版本号
			 *    authorizerAppid :  'wx833943b167b4012a',  // 账户 appid
			 *    codeId          :  '5937f6922f301e005884e565',  // 关联的 代码 id
			 * }
			 */
			return submitAuditLogApi.log({
				auditid: audit.auditid,
				version: code.version,
				authorizerAppid,
				codeId: code.id
			});
		}).then( () => {
			log('a worker done.')
			return { ok: true }
		}, (err) => {
			errorlog(err);
			return { ok: false, status: false }
		});
	}
	return Promise.reject({ ok: false, status: false })
});

rabbitmq.start()

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createDelayPublisher(delayExchangeName, function (ch) { delayPublisherChannel = ch });
}, 5000);