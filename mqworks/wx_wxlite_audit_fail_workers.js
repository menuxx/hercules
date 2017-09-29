/**
// 微信小程序审核失败
// routingKey: wx.wxlite.audit_fail
// { authorizerAppId, failTime, reason, createTime }
// authorizerAppId: 小程序 Id
// fail_time: 失败时间，用于记录log
// 根据小程序原始id 在 leancloud DinerWXLite Class 中查找到对应的 diner 然后在 AuditLog Class 中 生成对应的记录
// 1. pubuim 通知 authorizer_appid 小程序审核失败，并显示原因。
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {log, errorlog} = require('../logger')('wx_wxlite_audit_fail');
const {wxtime} = require('../lib/date');
const rabbitmq = require('../components/rabbitmq')();
const {pubuWeixin} = require('../pubuim');
const {shopApi, submitAuditLogApi, auditLogApi} = require('../leancloud');

const exchangeName = 'yth.rd3'
const queueName = 'wx_wxlite_audit_fail_queue'
const routingKey = ROUTING_KEYS.WX_WxliteAuditFail

rabbitmq.createSimpleWorker({exchangeNames: [exchangeName], queueName, routingKey}, function (msg, ch) {
	let {authorizerAppid, reason, failTime, createTime} = msg;
	log('a worker begin... authorizerAppid:' + authorizerAppid + ' reason: ' + reason);
	return Promise.all([
		shopApi.getAuthorizerByAppid(authorizerAppid),
		submitAuditLogApi.getNewest(authorizerAppid)
	]).then(function (res) {
		let shop = res[0], submit = res[1]
		log(shop, submit)
		/**
		 * struct:
		 * {
		 *    createTime: 1488856741,
		 *    failTime : 1488856591,
		 *    reason   : '1:账号信息不符合规范:<br>
		 * (1):包含色情因素<br>
		 * 2:服务类目"金融业-保险_"与你提交代码审核时设置的功能页面内容不一致:<br>
		 * (1):功能页面设置的部分标签不属于所选的服务类目范围。<br>
		 * (2):功能页面设置的部分标签与该页面内容不相关。<br>',
		 *    authorizerAppid    : 'wx833943b167b4012a',  // 关联的 用户 appid
		 *    submitId :  '543745419728372387cv34879532',   // 审核提交 id
		 * }
		 */
		return Promise.all([
			// 记录日志
			auditLogApi.log({
				createTime: wxtime(createTime),
				failTime: wxtime(failTime),
				authorizerAppid: shop.authorizerAppid,
				submitId: submit.id,
				reason
			}),
			// 发送 pubuim 通知
			// {codeVersion, templateType}, appName, appId, reason
			pubuWeixin.sendCodeAuditFail(
				{ codeVersion: submit.version, templateType: shop.templateType },
				shop.appName, shop.authorizerAppid, reason
			)
		]);
	})
	.then(function () {
		log('a worker done.');
		return { ok: true };
	}, function (err) {
		// 如果失败丢弃该消息
		// 通过手动触发执行
		errorlog('worker fire error: ', err);
		return { ok: false, status: false };
	});
});

rabbitmq.start()