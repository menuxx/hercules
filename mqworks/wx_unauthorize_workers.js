/**
// 当有用户取消授权
// routingKey: wx.unauthorize
// msg { appId, authorizerAppid, createTime }
// appId : 第三方服务平台的 appId
// authorizerAppid: 用户 appid
// create_time: 微信通知的时间
// 该处完成的工作有
// 1. 为该 授权用户应用 关闭 令牌刷新循环
// 2. 解除绑定 tester 和清空 domains 的操作
// 3. 短信通知 用户 取消授权完成
// 4. pubuim 通知 用户取消授权
// 5. webhook 通知服务器，更改状态
// 6. 向 leancloud 穿件取消授权日志
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {log, errorlog} = require('../logger')('wx_unauthorize');
const {authorizerCache} = require('../components/cache');
const {createSimpleWorker} = require('../components/rabbitmq');
const wxlite = require('../wxlite');
const sms = require('../components/ronglian');
const {pubuWeixin} = require('../pubuim');
const {putAuthorizerBy, getAuthorizerBy} = require('../service');
const {dinerApi, authorizeApi} = require('../leancloud');

const webNotify = require('../components/webhook').start({queue: 'wx_unauthorize'});

const queueName = 'wx_unauthorize_queue';
const routingKey = ROUTING_KEYS.WX_UnAuthorize;

createSimpleWorker({queueName, routingKey}, function ( msg, channel ) {
	let { appId, authorizerAppid, createTime } = msg;
	log('a worker begin..., authorizerAppid: %s', authorizerAppid);
	// 1. 清除 刷新令牌的 msg id
	// 使 刷新令牌循环 自动退出
	return getAuthorizerBy({appid: authorizerAppid}).then(function (diner) {
		return Promise.all([
			authorizerCache.putRefreshTokenMsgId(authorizerAppid, null),
			dinerApi.getAuthorizerByAppid(authorizerAppid).then(function ({testers}) {
				return Promise.all([
					// 2.1 解除绑定的 tester
					wxlite.unbindTesters(authorizerAppid, testers),
					// 2.2 清空 domains 的操作
					wxlite.cleanDomains(authorizerAppid)
				]);
			}, function (err) {
				errorlog('unbind tester or clean domain failed ... %o', err);
			}),
			// 发送通知
			Promise.all([
				// 3。给用户发送短信通知
				sms.sendUnauthorizedSMS(diner.masterPhone, [diner.masterName, diner.appName, diner.masterPhone]),
				// 4. 给平台发送通知
				pubuWeixin.sendWXUnAuthorized({appId: authorizerAppid, ...diner})
			]),
			// 5. 通知服务器，更改状态
			putAuthorizerBy(webNotify, { appid: authorizerAppid}, { authorizerStatus: 0 }),
			// 6. 写入日志
			authorizeApi.logUnauthorize({
				authorizerAppid,
				actionTime: createTime,
				componentAppid: appId
			})
		]);
		log('a worker done.');
	})
	// 解除绑定的所有工作，都不需要保证正确性，所以，所有的消息，都通知完成
	.then(function () {
		return { ok: true }
	}, function (err) {
		if (err.message === 'diner not found') {
			log('the diner not in app system')
		} else {
			errorlog('unauthorize has error: %s, stack -> ', err.message, err.stack);
		}
		return { ok: false, status: false }
	});
});