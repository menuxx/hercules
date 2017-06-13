/**
// 力士平台 access_token 更新
// routingKey: hercules.update_access_token
// 微信发送过来的验证票据 ComponentVerifyTicket
// msg { verifyTicket, appId }
// appId : 第三方服务平台的 appId
// 根据 verifyTicket 换取 component_access_token
// 再用 component_access_token 换取 pre_auth_code
// 然后将其缓存起来，以供其他程序调用
// 完成后发送 消息到 hercules.update_access_token.success routingKey . 通知 webhook 去更新其他应用
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {errorlog, log} = require('../logger')('update_access_token');
const {wx3rdApi} = require('../wxopenapi');
const {componentCacheSave} = require('../components/cache');
const {createSimpleWorker, createPublisher, publish2} = require('../components/rabbitmq');

let publisherChannel = null;
const queueName = 'update_access_token';
const routingKey = ROUTING_KEYS.Hercules_UpdateAccessToken;

createSimpleWorker({queueName, routingKey}, function (msg, ch) {
	let {appId, verifyTicket} = msg;
	return wx3rdApi.wxGetComponentToken({verifyTicket})
		.then(function({component_access_token}) {
			log('component_access_token: ', component_access_token);
			return wx3rdApi.wxGetPreAuthCode({accessToken: component_access_token}).then(function({pre_auth_code}) {
				return {
					pre_auth_code, component_access_token
				}
			})
		})
		.then(function({component_access_token, pre_auth_code}) {
			log('pre_auth_code: ', pre_auth_code);
			let tokens = {
				component_verify_ticket: verifyTicket,
				pre_auth_code,
				component_access_token
			};
			return componentCacheSave(tokens).then(function() {
				return tokens
			})
		})
		.then(function (tokens) {
			// 通知 其他应用 更新 token 组
			return publish2(publisherChannel, ROUTING_KEYS.Hercules_UpdateAccessTokenSuccess, tokens)
		})
		.then(function () {
			return { ok : true }
		}, function () {
			return { ok : false, status: false }
		})
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createPublisher(function (ch) { publisherChannel = ch });
}, 2000);