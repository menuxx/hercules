/**
// 微信小程序审核成功
// routingKey: wx.wxlite.audit_success
// { originAppId, successTime, createTime }
// originAppId: 小程序原始id
// successTime: 成功时间，用于记录log
// 根据小程序原始id 在 leancloud DinerWXLite Class 中查找到对应的 diner 然后在 AuditLog Class 中 生成对应的记录
// 1. pubuim 通知 authorizer_appid 小程序已经完成审核，待发布
// 2. 或根据流水线配置，直接发布该小程序，不通知 pubuim
**/
const {ROUTING_KEYS} = require('./');
const {wxtime} = require('../lib/date');
const {log, errorlog} = require('../logger')('wx_wxlite_audit_fail');
const {dinerApi, submitAuditLogApi, auditLogApi} = require('../leancloud');
const {pubuWeixin} = require('../pubuim');
const {createSimpleWorker, createPublisher, publish2} = require('../components/rabbitmq');

const queueName = 'wx_wxlite_audit_success';
const routingKey = ROUTING_KEYS.WX_WxliteAuditSuccess;

let publisherChannel = null;

createSimpleWorker({ queueName, routingKey }, function (msg, ch) {
	log('a worker begin...');
	let {originAppId, successTime, createTime} = msg;
	// 获取当前用户是否支持，自动发布
	return dinerApi
		.getAuthorizerByOriginAppId(originAppId).then(function (diner) {
		// 如果支持 autoRelease ，就自动发布，否则 中断 将发布权限交给 pubuim
		if (diner.autoRelease) {
			return publish2(publisherChannel, ROUTING_KEYS.Hercules_WxliteCodeRelease, {
				authorizer_appid: diner.authorizerAppid
			});
		} else {
			// 获取最近一次代码提交审核记录
			// {codeVersion, templateId}, shopName, appId
			return submitAuditLogApi.getNewest(diner.authorizerAppid).then(function (submit) {
				let {version, _objectId} = submit;
				/*
				 * struct:
				 * {
				 *    succTime : 1488856741,
				 *    createTime: 1488856591,
				 *    submitId :  '543745419728372387cv34879532',   // 审核提交 id
				 *    authorizerAppid: 'wx833943b167b4012a',    // 关联的 用户 appid
				 * }
				 * */
				return Promise.all
				([
					auditLogApi.log({
						succTime: wxtime(successTime),
						createTime: wxtime(createTime),
						submitId: _objectId,
						authorizerAppid: diner.authorizerAppid
					}),
					pubuWeixin.sendCodeAuditSuccess(
						{ codeVersion: version, templateId: diner.templateId },
						diner.appName, diner.authorizerAppid
					)
				]);
			});
		}
	})
	.then(function () {
		log('a worker done.');
		return { ok: true };
	}, function (err) {
		// 如果失败丢弃该消息
		// 通过手动触发执行
		errorlog('worker fire error: ', err);
		return { ok: false, status: false };
	})
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createPublisher(function (ch) { publisherChannel = ch });
}, 2000);