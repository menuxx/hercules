/**
// component_access_token 更新成功
// routingKey: hercules.update_access_token.success
// component_access_token 和 pre_auth_code 更新成功
// msg { appId }
// appId : 第三方服务平台的 appId
// 暂时没有处理这个 appId, 目前只支持单平台。当启用多平台之气的时候，可以使用该值
// 1. 通过 webhook 通知其他应用服务器
**/
require('babel-register');
const {ROUTING_KEYS} = require('./');
const {errorlog, log} = require('../logger')('update_access_token');
const {cachePublishPointers} = require('../config');
require('../components/webhook').start({ queue: 'worker01_webhooks' });
const {webNotify} = require('../components/webhook');
const {createSimpleWorker} = require('../components/rabbitmq');

const queueName = 'update_access_token_success';
const routingKey = ROUTING_KEYS.Hercules_UpdateAccessTokenSuccess;

createSimpleWorker({queueName, routingKey}, function (msg, ch) {
	return Promise.all(cachePublishPointers.map(function (pointer) {
		return webNotify(pointer, msg);
	})).then(function () {
		return { ok: true };
	}, function (err) {
		errorlog(err);
		return { ok: false, status: false };
	});
});