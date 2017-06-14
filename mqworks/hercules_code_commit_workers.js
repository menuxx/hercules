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
const {createSimpleWorker, publish2, createPublisher} = require('../components/rabbitmq');

const queueName = 'wxlite_code_commit_queue';
const routingKey = ROUTING_KEYS.Hercules_WxliteCodeCommit;

let publisherChannel = null;

createSimpleWorker({queueName, routingKey}, function (msg, ch) {
	let {authorizerAppid, version} = msg;
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	// 每次都覆盖 domains
	return wxlite.codeCommit(authorizerAppid, true).then(function ({diner, code}) {
		log('appid %s code commit ok', authorizerAppid);
		// 是否支持自动提交审核
		if (diner.autoSubmitAudit) {
			// 自动提交审核
			return publish2(publisherChannel, ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
				authorizerAppid,
				version: code.version
			});
		} else {
			// 发送 pubuim 通知, 手动提交审核
			return pubuWeixin.sendCodeCommitOk
			(
				{ codeVersion: code.version, templateType: code.templateType }, diner.appName, diner.authorizerAppid, wxlite.getQrcodeUrl(authorizerAppid)
			).then(function () {
				return { diner, code };
			});
		}
	})
	.then(function () {
		log('a worker done.');
		return { ok : true };
	}, function () {
		errorlog();
		return { ok : false, status: false };
	});
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createPublisher(function (ch) { publisherChannel = ch });
}, 2000);