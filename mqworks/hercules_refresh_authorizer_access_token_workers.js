/**
 // 力士平台 用户 access_token 令牌自刷新
 // hercules.refersh_authorizer_access_token
 // msg : { authorizerAppid, authorizerRefreshToken, refreshTokenMsgId }
 // 根据 刷新令牌(authorizerRefreshToken) 和 authorizer_appid 直接从 微信获取新的 authorizer_access_token, authorizer_refresh_token
 // 然后将其存储到 redis 缓存中，并发送一个 6000 秒后发送的延迟消息，从而实现循环循环刷新
 // 将获取的令牌和刷新令牌存储到redis中，供后续调用
 **/
const {ROUTING_KEYS} = require('./');
const {log, errorlog} = require('../logger')('refresh_access_toke');
const {isEmpty} = require('lodash');
const {wx3rdApi} = require('../wxopenapi');
const {tokenCache, authorizerCache} = require('../components/cache');
// https://github.com/kelektiv/node-uuid
const uuid = require('uuid/v4');
const {createSimpleWorker, createDelayPublisher, publishDelay} = require('../components/rabbitmq');

const queueName = 'hercules_refresh_access_token_queue';
const routingKey = ROUTING_KEYS.Hercules_RefershAccessToken;
var delayPublisherChannel = null;

createSimpleWorker({queueName, routingKey}, function (msg, channel) {
	// 循环的开始将检测 msg_id 与缓存中的 msg_id 是否一致。不一致，就丢弃消息，一致的话，就执行
	let {authorizerAppid, refreshTokenMsgId} = msg;
	log('a worker begin..., authorizerAppid: %s refreshTokenMsgId: %s', authorizerAppid, refreshTokenMsgId);
	return authorizerCache.getRefreshTokenMsgId(authorizerAppid).then(function (msgId) {
		log('current refreshTokenMsgId: %s, message id: %s', refreshTokenMsgId, msgId);
		if (isEmpty(refreshTokenMsgId) || refreshTokenMsgId !== msgId) {
			// 丢弃消息
			return {ok: false, status: false};
		}
		else {
			// 执行刷新
			return doRefresh(msg);
		}
	});
});

// 执行刷新
function doRefresh({authorizerAppid, authorizerRefreshToken}) {
	return tokenCache.getComponentAccessToken().then(function (accessToken) {
		/**
		 *  // wxRefreshApiAuthorizerToken 返回值
		 *  {
    *    "authorizer_access_token": "aaUl5s6kAByLwgV0BhXNuIFFUqfrR8vTATsoSHukcIGqJgrc4KmMJ-JlKoC_-NKCLBvuU1cWPv4vDcLN8Z0pn5I45mpATruU0b51hzeT1f8", 
    *    "expires_in": 7200,
    *    "authorizer_refresh_token": "BstnRqgTJBXb9N2aJq6L5hzfJwP406tpfahQeLNxX0w"
    *  }
		 */
		// component_access_token, authorizer_appid, authorizer_refresh_token
		return wx3rdApi.wxRefreshApiAuthorizerToken({
			component_access_token: accessToken,
			authorizer_appid: authorizerAppid,
			authorizer_refresh_token: authorizerRefreshToken
		})
	})
	// 获得新的 token 组
		.then(function ({authorizer_access_token, authorizer_refresh_token, expires_in}) {
			return authorizerCache.getAuthorizerInfo(authorizerAppid).then(function (info) {
				info.authorizer_access_token = authorizer_access_token;
				info.authorizer_refresh_token = authorizer_refresh_token;
				info.expires_in = expires_in;
				return info
			})
		})
		// 将新的令牌组 更新回缓存
		.then(function (info) {
			return authorizerCache.putAuthorizerInfo(authorizerAppid, info).then(function () {
				return info
			})
		})
		// 下一个循环
		// 并重新生成 msg_i
		// 下一个循环的开始将检测 msg_id 如果和此次存入的不一致，该消息将会被丢弃
		.then(function (info) {
			let msgId = uuid();
			let {expires_in=6000, authorizer_refresh_token} = info;
			if ( delayPublisherChannel === null ) {
				return { ok : false, status: true }
			}
			return Promise.all([
				authorizerCache.putRefreshTokenMsgId(authorizerAppid, msgId),
				publishDelay(delayPublisherChannel, (1000 * (expires_in - 1000)), ROUTING_KEYS.Hercules_RefershAccessToken,
				// publishDelay(delayPublisherChannel, 2000, ROUTING_KEYS.Hercules_RefershAccessToken,
					{
						authorizerAppid,
						authorizerRefreshToken: authorizer_refresh_token,
						refreshTokenMsgId: msgId
					})
			])
		})
		.then(function () {
			log('a work done.');
			return { ok : true }
		}, function (err) {
			errorlog(err);
			return { ok : false, status: false }
		})
}

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	createDelayPublisher(function (ch) {
		delayPublisherChannel = ch
	});
}, 2000);