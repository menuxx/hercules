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
const {dinerApi, wxcodeApi} = require('../leancloud');

const {createSimpleWorker} = require('../components/rabbitmq');

const queueName = 'wxlite_code_release';
const routingKey = ROUTING_KEYS.Hercules_WxliteCodeRelease;

createSimpleWorker({queueName, routingKey}, function (msg, ch) {
	let {authorizerAppid} = msg;
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	return wxlite.codeRelease(authorizerAppid)
		.then(function (releaseOk) {
			// 获取 商户 和商户 代码发布相关的信息
			return dinerApi.getAuthorizerByAppid(authorizerAppid).then(function (diner) {
				return wxcodeApi.firstCodeType(diner.templateType)
					.then(function (code) {
						return {diner, code}
					});
			});
		})
		.then(function ({diner, code}) {
		log('appid %s code release ok');
		// 发送 pubu 通知
		return pubuWeixin.sendCodeReleaseOK
		(
			{ codeVersion: code.version, templateType: code.templateType }, diner.appName, diner.authorizerAppid
		);
	}).then(function () {
		log('a worker done.');
		return { ok : true };
	}, function (err) {
		errorlog(err);
		return { ok : false, status: false };
	});
});