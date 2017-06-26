/**
 // 当有新的用户授权
 // routingKey: wx.authorized
 // msg { appId, authorizerAppid, createTime. authorizationCode, authorizationCodeExpiredTime }
 // appId : 第三方服务平台的 appId
 // authorizerAppid: 用户 appid
 // authorization_code: 授权码（code）
 // authorization_code_expired_time: 授权码过期时间
 // 因为采用了自循环机制，所以 授权码过期时间 在此处 没有用到
 // 自循环机制会在每个授权的 6000 毫秒，重新用刷新令牌换取新的令牌
 // 该处完成的工作有
 // 1. 为该 授权用户应用 开启 令牌刷新循环
 // 2. 执行绑定 tester
 // 3. 短信通知 用户 成功授权
 // 4. pubuim 通知 授权完成
 // 5. webhook 通知服务器，更改状态
 **/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {log, errorlog} = require('../logger')('wx_authorized');
const {tokenCache, authorizerCache} = require('../components/cache');
const {createSimpleWorker, createDelayPublisher, publishDelay} = require('../components/rabbitmq');
const {plInfo} = require('../config');
const wxlite = require('../wxlite');
const sms = require('../components/ronglian');
const {pubuWeixin} = require('../pubuim');
const {putAuthorizerBy, getAuthorizerBy} = require('../service');
const {wx3rdApi} = require('../wxopenapi');
const {authorizeApi} = require('../leancloud')
// https://github.com/kelektiv/node-uuid
const uuid = require('uuid/v4');
const webNotify = require('../components/webhook').start({queue: 'wx_authorized'});
const queueName = 'wx_authorized_queue';
const routingKey = ROUTING_KEYS.WX_Authorized;
const {union} = require('lodash');

let delayPublisherChannel = null;

// 如果扫描的系统在当前系统中不存在，就忽略该用户
createSimpleWorker({queueName, routingKey}, function (msg, channel) {

	let {appId, authorizerAppid, authorizationCode, createTime} = msg;

	log('a worker begin..., authorizerAppid: %s', authorizerAppid);

	return Promise.all([
		getAuthorizerBy({appid: authorizerAppid}),
	]).then(function (dinerInfo) {
		return tokenCache.getComponentAccessToken()
			.then(function (componentAccessToken) {
				// 此处 appId 可以 当做 componentAppid 使用
				return wx3rdApi.wxQueryAuth({accessToken: componentAccessToken, authCode: authorizationCode})
			})
			.then(function ({authorization_info}) {
				// 全部完成后
				return authorizerCache.putAuthorizerInfo(authorizerAppid, authorization_info).then(function () {
					return authorization_info
				})
			})
			.then(function ({authorizer_refresh_token, expires_in=6000}) {
				let msgId = uuid();
				let testers = union(plInfo.testers, []);
				return Promise.all([
					// 更新循环 msg_id 是的循环正常运行
					authorizerCache.putRefreshTokenMsgId(authorizerAppid, msgId),
					// 1. 发送自循环启动通知
					publishDelay(delayPublisherChannel, (1000 * (expires_in - 1000)), ROUTING_KEYS.Hercules_RefershAccessToken,
					// publishDelay(delayPublisherChannel, 2000, ROUTING_KEYS.Hercules_RefershAccessToken,
						{
							authorizerAppid,
							authorizerRefreshToken: authorizer_refresh_token,
							refreshTokenMsgId: msgId
						}
					),
					// 2. 绑定 tester, 忽略已绑定错误
					wxlite.bindTesters(authorizerAppid, testers, true),
					// 5. webhook 通知服务器，更改状态
					putAuthorizerBy(webNotify, {appid: authorizerAppid}, {authorizerStatus: 1})
				]);
			})
			// 先完成重要任务，然后再通知
			.then(function () {
				return Promise.all([
					authorizeApi.logAuthorized({
						authorizerAppid,
						authorizationCode,
						actionTime: createTime
					}),
					// 3. 短信通知 用户 成功授权
					sms.sendAuthorizedSMS(dinerInfo.masterPhone, [dinerInfo.masterName, dinerInfo.shopName]),
					// 4. 短信通知 用户 成功授权
					pubuWeixin.sendWXAuthorized({appId: authorizerAppid, shopName: dinerInfo.shopName})
				]);
			});
	}).then(function () {
		log('a worker done.');
		// 成功完成该消息
		return {ok: true};
	}, function (err) {
		if (err.message === 'diner not found') {
			errorlog('the diner not in app system')
		} else {
			errorlog('do authorized has error: %s, stack -> ', err.message, err.stack);
		}
		return { ok: false, status: false };
	});
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createDelayPublisher(function (ch) {
		delayPublisherChannel = ch
	});
}, 2000);