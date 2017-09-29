/**
 // 力士平台 用户 access_token 令牌自刷新
 // hercules.refersh_authorizer_access_token
 // msg : { authorizerAppid, authorizerRefreshToken, refreshTokenMsgId }
 // 根据 刷新令牌(authorizerRefreshToken) 和 authorizer_appid 直接从 微信获取新的 authorizer_access_token, authorizer_refresh_token
 // 然后将其存储到 redis 缓存中，并发送一个 6000 秒后发送的延迟消息，从而实现循环循环刷新
 // 将获取的令牌和刷新令牌存储到redis中，供后续调用
 **/
require('babel-register');
const {ROUTING_KEYS} = require('./')
const {log, errorlog} = require('../logger')('refresh_access_toke')
const {wx3rdApi} = require('../wxopenapi')
const {tokenCache, authorizerCache} = require('../components/cache')
const rabbitmq = require('../components/rabbitmq')()
const {isEmpty} = require('lodash')

const delayExchangeName = 'yth.rd3.delay'
const queueName = 'hercules_refresh_access_token_queue'
const routingKey = ROUTING_KEYS.Hercules_RefershAccessToken
var delayPublisherChannel = null

rabbitmq.createSimpleWorker({exchangeNames: [delayExchangeName], queueName, routingKey}, function (msg, channel) {
	// 循环的开始将检测 msg_id 与缓存中的 msg_id 是否一致。不一致，就丢弃消息，一致的话，就执行
	let {authorizerAppid, authorizerRefreshToken, loopId} = msg;
	if ( !isEmpty(authorizerAppid) && !isEmpty(authorizerRefreshToken) ) {
		log('a worker begin..., authorizerAppid: %s', authorizerAppid);
		return authorizerCache.getAuthorization(authorizerAppid).then((authorization) => {
			// 未授权就停止令牌刷新循环
			if ( !isEmpty(authorization) && authorization.loopId === loopId) {
				return doRefresh({
					authorizerAppid,
					authorizerRefreshToken, // 使用新的刷新令牌
					loopId
				})
			} else {
				// 终止循环
				return { ok : false, status: false }
			}
		})
	}
	return Promise.reject({ ok : false, status: false })
});

// 执行刷新
function doRefresh({authorizerAppid, authorizerRefreshToken, loopId}) {
	return tokenCache.getComponentAccessToken().then( componentAccessToken => {

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
			componentAccessToken,
			authorizerAppid,
			authorizerRefreshToken
		})
	})
	// 获得新的 token 组
	.then( authorization => {
		let {authorizer_refresh_token, expires_in} = authorization
		expires_in = 3
		return Promise.all([
			rabbitmq.publishDelay(delayPublisherChannel, delayExchangeName, ROUTING_KEYS.Hercules_RefershAccessToken,
			// publishDelay(delayPublisherChannel, 2000, ROUTING_KEYS.Hercules_RefershAccessToken,
			{
				loopId,
				authorizerAppid,
				authorizerRefreshToken: authorizer_refresh_token
			}, expires_in),

			authorizerCache.putAuthorization(authorizerAppid, {
				loopId,
				...authorization
			})
		])
	})
	.then( () => {
		log('a work done.');
		return { ok : true }
	}, (err) => {
		errorlog(err);
		return { ok : false, status: false }
	})
}

rabbitmq.start()

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createDelayPublisher(delayExchangeName, (ch) => { delayPublisherChannel = ch });
}, 5000);