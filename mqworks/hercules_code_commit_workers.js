/**
// 力士平台 代码提交
// routingKey: hercules.wxlite.code_commit
// msg: { authorizerAppid, version }
// 将 code 为 version 的代码发布到 appid 上
// TODO: 由于当前暂不具备 微信的 uploadPack 能力，所以 version 暂时没有作用。
// version 默认从最新的 leancloud WXLiteCode Class 中提取最新的 version
// 所以 version 暂时作为扩展字段
**/
require('babel-register');
const {ROUTING_KEYS} = require('./')
const {log, errorlog} = require('../logger')('code_commit');
const wxlite = require('../wxlite')
const {pubuWeixin} = require('../pubuim')
const {isEmpty} = require('lodash')
const rabbitmq = require('../components/rabbitmq')();

const exchangeName = 'yth.rd3'
const queueName = 'wxlite_code_commit_queue';
const routingKey = ROUTING_KEYS.Hercules_WxliteCodeCommit;

var publisherChannel = null

rabbitmq.createSimpleWorker({exchangeNames: [exchangeName], queueName, routingKey}, function (msg, ch) {
	let {authorizerAppid, version} = msg;
	// 忽略错误数据
	if (!isEmpty(authorizerAppid) && !isEmpty(version)) {
		log('a worker begin..., authorizerAppid: %s', authorizerAppid);
		// 每次都覆盖 domains
		return wxlite.codeCommit(authorizerAppid, true).then(function ({shop, code}) {
			log('appid %s code commit ok', authorizerAppid);
			// 是否支持自动提交审核
			if (shop.autoSubmitAudit) {
				// 自动提交审核
				return rabbitmq.publish2(publisherChannel, exchangeName, ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
					authorizerAppid,
					version: code.version,
					pipline: true
				});
			} else {
				// 发送 pubuim 通知, 手动提交审核
				return pubuWeixin.sendCodeCommitOk
				(
					{ codeVersion: code.version, templateType: code.templateType }, shop.shopName, shop.authorizerAppid, wxlite.getQrcodeUrl(authorizerAppid)
				).then(function () {
					return { shop, code };
				});
			}
		})
		.then(function () {
			log('a worker done.');
			return { ok : true };
		}, function (err) {
			errorlog(err);
			return { ok : false, status: false };
		});
	}
	return Promise.reject({ ok : false, status: false })
});

rabbitmq.start()

setTimeout(function () {
	rabbitmq.createPublisher(function (ch) {
		publisherChannel = ch
	})
}, 5000)