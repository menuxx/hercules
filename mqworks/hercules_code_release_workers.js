/**
// 力士平台小程序代码发布
// routingKey: hercules.wxlite.code_release
// msg { authorizerAppid }
// 根据 authorizerAppid 直接发布 完成审核的版本
// pubuim 通知发布完成
// 更新 leancloud DinerWXLite
**/
require('babel-register');
const {ROUTING_KEYS} = require('./')
const {log, errorlog} = require('../logger')('code_release');
const wxlite = require('../wxlite')
const {pubuWeixin} = require('../pubuim')
const {shopApi, wxcodeApi} = require('../leancloud');
const {isEmpty} = require('lodash')

const rabbitmq = require('../components/rabbitmq')();

const exchangeName = 'yth.rd3'
const delayExchangeName = 'yth.rd3.delay'
const queueName = 'wxlite_code_release';
const routingKey = ROUTING_KEYS.Hercules_WxliteCodeRelease;

var delayPublisherChannel = null

rabbitmq.createSimpleWorker({exchangeNames: [exchangeName, delayExchangeName], queueName, routingKey}, function (msg, ch) {
	let {authorizerAppid, times} = msg;
	times = isEmpty(times) ? 1 : times
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	return wxlite.codeRelease(authorizerAppid)
		.then(function (release) {
			// 超过3次，丢弃该请求
			if ( times > 3 ) {
				return { ok : false, status: false };
			}
			// 审核失败的时候, 直接丢弃该请求
			if ( release.status !== 0 ) {
				// 服务器返回成功
				if ( release.errcode === 0 ) {
					// 获取 商户 和商户 代码发布相关的信息
					return shopApi.getAuthorizerByAppid(authorizerAppid).then(function (shop) {
						return wxcodeApi.firstCodeType(diner.templateType)
							.then(function (code) {
								return {shop, code}
							});
					});
				} else {
					// 10 秒后重试
					rabbitmq.publishDelay(delayPublisherChannel, delayExchangeName, ROUTING_KEYS.Hercules_WxliteCodeRelease, {
						authorizerAppid,
						times
					}, 60 * times)
					return { ok : false, status: false };
				}
			}
			return { ok : false, status: false };
		})
		.then(function ({shop, code}) {
		log('appid %s code release ok');
		// 发送 pubu 通知
		return pubuWeixin.sendCodeReleaseOK
		(
			{ codeVersion: code.version, templateType: code.templateType }, shop.appName, shop.authorizerAppid
		);
	}).then(function () {
		log('a worker done.');
		return { ok : true };
	}, function (err) {
		errorlog(err);
		return { ok : false, status: false };
	});
});

rabbitmq.start()

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createDelayPublisher(delayExchangeName, function (ch) { delayPublisherChannel = ch });
}, 5000);