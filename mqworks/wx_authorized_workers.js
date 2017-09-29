/**
 // 当有新的用户授权
 // routingKey: wx.authorized
 // msg { appId, authorizerAppid, createTime, authorizationCode, authorizationCodeExpiredTime }
 // appId : 第三方服务平台的 appId
 // authorizerAppid: 用户 appid
 // authorization_code: 授权码（code）
 // authorization_code_expired_time: 授权码过期时间
 // 因为采用了自循环机制，所以 授权码过期时间 在此处 没有用到
 // 自循环机制会在每个授权的 6000 毫秒，重新用刷新令牌换取新的令牌
 // 该处完成的工作有
 // 0. 将用户 刷新令牌 和授权信息 写入到持久存储
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
const rabbitmq = require('../components/rabbitmq')();
const {plInfo} = require('../config');
const wxlite = require('../wxlite');
const sms = require('../components/ronglian');
const {pubuWeixin} = require('../pubuim');
const {putAuthorizerBy, getAuthorizerBy} = require('../service');
const {wx3rdApi} = require('../wxopenapi');
const {authorizeApi, authorizerApi} = require('../leancloud');
const webNotify = require('../components/webhook').start({queue: 'wx_authorized'});

const uuid = require('uuid-v4');

const delayExchangeName = 'yth.rd3.delay';
const exchangeName = 'wxauthorize';
const queueName = 'wx_authorized';
const routingKey = ROUTING_KEYS.WX_Authorized;

const {union, isEmpty} = require('lodash');

let delayPublisherChannel = null;

// 如果扫描的系统在当前系统中不存在，就忽略该用户
rabbitmq.createSimpleWorker({exchangeNames: [exchangeName], queueName, routingKey}, function (msg) {

	let {appId, authorizerAppid, authorizationCode} = msg;

	if (!isEmpty(appId) && !isEmpty(authorizerAppid) && !isEmpty(authorizationCode)) {

		log('a worker begin..., authorizerAppid: %s', authorizerAppid);

		return tokenCache.getComponentAccessToken().then(componentAccessToken => {

			return Promise.all([
				wx3rdApi.wxQueryAuth({componentAccessToken, authCode: authorizationCode}),
				wx3rdApi.wxGetAuthorizerInfo({authorizerAppid, componentAccessToken})
			])
			.then((res) => {
				// 授权信息
				// 授权者信息
				let {authorization_info} = res[0], {authorizer_info} = res[1];
				// appId, logoImg, primaryName, businessName, qrcodeUrl, refreshToken
				return authorizerApi.save({
					appId: authorization_info.authorizer_appid,
					logoUrl: authorizer_info.head_img,
					primaryName: authorizer_info.nick_name,
					businessName: authorizer_info.principal_name,
					qrcodeUrl: authorizer_info.qrcode_url,
					refreshToken: authorization_info.authorizer_refresh_token,
					authorized: true
				}).then(function (authorizer) {
					return {authorizer, authorization_info}
				})
			})
			.then(({ authorizer, authorization_info }) => {
				let {refreshToken} = authorizer
				// 1. 发送自循环启动通知
				let expires_in = 7200 - 100
				let newLoopId = uuid()
				return Promise.all([
					authorizerCache.putAuthorization(authorizerAppid, {
						loopId: newLoopId,
						...authorization_info
					}),
					rabbitmq.publishDelay(delayPublisherChannel, delayExchangeName, ROUTING_KEYS.Hercules_RefershAccessToken,
					// publishDelay(delayPublisherChannel, 2000, ROUTING_KEYS.Hercules_RefershAccessToken,
					{
						loopId: newLoopId,
						authorizerAppid,
						authorizerRefreshToken: refreshToken
					}, expires_in),
					// 5. webhook 通知服务器，更改状态
					putAuthorizerBy(webNotify, {appid: authorizerAppid}, {authorizerStatus: 1})
				]).then(() => authorizer)
			})
			// 先完成重要任务，然后再通知
			.then((authorizer) => {
				return getAuthorizerBy({appid: authorizerAppid}).then((shop) => {
					return {authorizer, shop}
				})
			})
			.then(({authorizer, shop}) => {
				let testers = union(plInfo.testers, [])
				// 4. 短信通知 用户 成功授权
				pubuWeixin.sendWXAuthorized({appId: authorizerAppid, appName: shop.shopName})
				return Promise.all([
					// 2. 绑定 tester, 忽略已绑定错误
					wxlite.bindTesters(authorizerAppid, testers, true),
					authorizeApi.logAuthorized({
						primaryName: authorizer.primaryName,
						authorizerAppid,
						authorizationCode
					}),
					// 3. 短信通知 用户 成功授权
					sms.sendAuthorizedSMS(shop.masterPhone, [shop.masterName, shop.shopName])
				]);
			})
		})
		.then(function () {
			log('a worker done.');
			// 成功完成该消息
			return {ok: true};
		}, function (err) {
			if (err.message === 'shop not found') {
				errorlog('the shop not in app system')
			} else {
				errorlog('do authorized has error: %s, stack -> ', err.message, err.stack);
			}
			return {ok: false, status: false};
		});

	}
	return Promise.reject({ ok: false, status: false });
});

rabbitmq.start()

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createDelayPublisher(delayExchangeName, function (ch) { delayPublisherChannel = ch });
}, 5000);