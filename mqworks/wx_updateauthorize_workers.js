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
 // 2. 更新 authorizer 缓存
 // 3. 短信通知 用户 更新授权成功
 **/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {createSimpleWorker, createDelayPublisher, publishDelay} = require('../components/rabbitmq');
const {tokenCache, authorizerCache} = require('../components/cache');
const {wx3rdApi} = require('../wxopenapi');
const {authorizerApi} = require('../leancloud')
const {plInfo} = require('../config');
const sms = require('../components/ronglian');
const {getAuthorizerBy} = require('../service');
const {isEmpty} = require('lodash')
const uuid = require('uuid-v4');

let delayPublisherChannel = null;

const routingKey = ROUTING_KEYS.WX_UpdateAuthorize;
const exchangeName = 'wxauthorize';
const queueName = 'wx_updateauthorize';

createSimpleWorker({exchangeName, queueName, routingKey}, function (msg, ch) {
	let {appId, authorizerAppid, authorizationCode} = msg;
	if (!isEmpty(appId) && !isEmpty(authorizerAppid) && !isEmpty(authorizationCode)) {
		let newLoopId = uuid()
		return tokenCache.getComponentAccessToken().then( componentAccessToken => {
			// 此处 appId 可以 当做 componentAppid 使用
			return Promise.all([
				authorizerApi.getByAppId(authorizerAppid),
				wx3rdApi.wxQueryAuth({accessToken: componentAccessToken, authCode: authorizationCode})
			])
			.then((res) => {
				let authorizer = res[0], authorization_info = res[1]
				let {authorizer_refresh_token, expires_in = 6000} = authorization_info
				// 减去 100 的延迟
				expires_in = expires_in >= 1000 ? expires_in -= 100 : expires_in
				// 如果更新授权后的 令牌不一致 就更新系统中的刷新令牌
				if (authorizer.refreshToken !== authorizer_refresh_token) {
					// 并发起新的刷新循环
					return Promise.all([
						authorizerApi.updateRefreshToken(authorizerAppid, authorizer.refreshToken),
						// 启动新的刷新循环
						publishDelay(delayPublisherChannel, "yth3rd", (1000 * expires_in), ROUTING_KEYS.Hercules_RefershAccessToken, {
							loopId: newLoopId,
							authorizerAppid,
							authorizerRefreshToken: authorizer_refresh_token
						}),
						// 刷新缓存
						authorizerCache.putAuthorization(authorizerAppid, {
							...authorization_info,
							loopId: newLoopId,
							authorizer_appid: authorizerAppid
						}).then(() => {
							return authorization_info
						})
					])
				}
				return authorization_info
			})
			.then(authorization_info => {
				return getAuthorizerBy({appid: authorizerAppid}).then(function (shop) {
					// 3. 短信通知 用户 成功授权
					return sms.sendUpdateauthorizedSMS(shop.masterPhone, [shop.masterName, shop.shopName, plInfo.contactPhone])
				})
			})
		}).then(() => {
			return {ok: true}
		}, () => {
			return {ok: false, status: true}
		})
	}
	return Promise.resolve({ok: true})
});

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createDelayPublisher("yth3rd", function (ch) {
		delayPublisherChannel = ch
	});
}, 2000);