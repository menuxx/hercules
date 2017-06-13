/**
// 现有用户更新授权
// routingKey: wx.updateauthorize
// msg { appId, authorizerAppid, authorizationCode }
// appId : 第三方服务平台的 appId
// authorizerAppid: 用户 appid
// authorization_code: 授权码（code）
// authorization_code_expired_time: 授权码过期时间
// 因为采用了自循环机制，所以 授权码过期时间 在此处 没有用到
// 自循环机制会在每个授权的 6000 毫秒，重新用刷新令牌换取新的令牌
// 该处完成的工作有
// 1. 为该 授权用户应用 重置 刷新令牌循环
// 2. 更新 authorizer 缓存
// 3. 短信通知 用户 更新授权成功
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {createSimpleWorker, createDelayPublisher, publishDelay} = require('../components/rabbitmq');
const {tokenCache, authorizerCache} = require('../components/cache');
const {wx3rdApi} = require('../wxopenapi');
const {plInfo} = require('../config');
const sms = require('../components/ronglian');
const {getAuthorizerBy} = require('../service');
// https://github.com/kelektiv/node-uuid
const uuid = require('uuid/v4');

let delayPublisherChannel = null;

const routingKey = ROUTING_KEYS.WX_UpdateAuthorize;
const queueName = 'wx_updateauthorize';

createSimpleWorker({queueName, routingKey}, function (msg, ch) {
	let { appId, authorizerAppid, authorizationCode } = msg;
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
		.then(function ({authorizer_refresh_token, expired_time=600}) {
			// 1. 中断之前的刷新循环
			// 2. 启动新的刷新循环
			let msgId = uuid();
			return Promise.all([
				// 更新 refresh_token_msg_id 从而使 上一个 未触发的 msg 失效, 从而中断上一个循环
				// 发布新的延迟循环
				authorizerCache.putRefreshTokenMsgId(authorizerAppid, msgId),
				publishDelay(delayPublisherChannel, 1000 * (expired_time - 1000), ROUTING_KEYS.Hercules_RefershAccessToken,
					{
						authorizerAppid,
						authorizerRefreshToken: authorizer_refresh_token,
						refreshTokenMsgId: msgId
					})
			]);
		})
		// 先完成重要任务，然后再通知
		.then(function () {
			return getAuthorizerBy({appid: authorizerAppid}).then(function (diner) {
				// 3. 短信通知 用户 成功授权
				return sms.sendUpdateauthorizedSMS(diner.masterPhone, [diner.masterName, diner.shopName, plInfo.contactPhone])
			});
		})
		.then(function () {
			return { ok: true }
		}, function () {
			return { ok: false, status: true }
		})
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createDelayPublisher(function (ch) { delayPublisherChannel = ch });
}, 2000);