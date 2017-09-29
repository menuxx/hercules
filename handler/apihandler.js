const {Router} = require('express');
const {makeError} = require('../lib/error');
const {log, errorlog} = require('../logger')('apihandler');
const {getAuthorizerBy} = require('../service');
const {jsonAutoValid} = require('../lib/params');
const {shopApi, wxcodeApi} = require('../leancloud');
const {tokenCache, authorizerCache} = require('../components/cache');
const wxlite = require('../wxlite');
const {wx3rdApi} = require('../wxopenapi');
const {server, plInfo} = require('../config');
const {toggleVisible} = require('../service');
const {ROUTING_KEYS} = require('../mqworks');
const rabbitmq = require('../components/rabbitmq')();
const {isEmpty, union} = require('lodash');
const uuid = require('uuid-v4');

const route = Router();

var delayPublisherChannel = null
var publisherChannel = null

route.get('/component_token', function (req, resp) {
	tokenCache.getComponentAccessToken().then(function (accessToken) {
		resp.json({ componentAccessToken: accessToken })
	}, function (err) {
		errorlog(err);
		resp.status(500).json(makeError(err, 500, err.message))
	})
});

// 获取 pre_auth_code
route.get('/pre_auth_url/:appkey', function (req, resp) {
	req.checkParams('appkey', 'url 上的 appkey 必须存在').notEmpty();
	jsonAutoValid(req, resp).then( () => {
		let {appkey} = req.params;
		wxlite.getPreAuthCode().then( ({ pre_auth_code }) => {
			log(pre_auth_code)
			log(`${server.siteUrl}/wx/3rd/authorize/${appkey}`)
			return wx3rdApi.wxGetAuthorizeUrl({
				authCode: pre_auth_code,
				redirectUri: `${server.siteUrl}/wx3rd/authorize/${appkey}`
			});
		}).then(function (url) {
			resp.json({ url })
		}, function (err) {
			log(err)
		})
	}, errorlog)
})

// 保存 item_list
route.put('/shop_wxlite/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		// 不接受对 关键字段的修改
		delete req.body.authorizerAppid;
		shopApi.saveAuthorizer(appid, req.body).then(resp.json.bind(resp));
	}, errorlog);
});

// channel, exchangeName, routingKey, content, delayS

route.post('/shop_wxlite/:appid/access_token_reset', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		let newLoopId = uuid();
		return wxlite.getAuthorizerInfo(appid).then(function ({authorization_info}) {
			let {authorizer_refresh_token} = authorization_info
			return wxlite.getAuthorizerAccessToken(appid, authorizer_refresh_token).then(({authorizer_access_token, expires_in}) => {
				// 10 秒刷新
				expires_in = (expires_in - 1000)
				expires_in = 5
				return Promise.all([
					authorizerCache.putAuthorization(appid, {
						authorizer_appid: appid,
						authorizer_refresh_token,
						authorizer_access_token,
						expires_in,
						loopId: newLoopId
					}),
					// 产生新的 loopId ，终端之前的循环
					rabbitmq.publishDelay(delayPublisherChannel, "yth.rd3.delay", ROUTING_KEYS.Hercules_RefershAccessToken, {
						loopId: newLoopId,
						authorizerAppid: appid,
						authorizerRefreshToken: authorizer_refresh_token
					}, expires_in)
				]).then(function () {
					resp.json({ authorizer_refresh_token, authorizer_access_token, expires_in })
				}, function (err) {
					console.log(err)
					resp.status(502).json(err)
				})
			})
		})
	}, errorlog);
})

// 恢复 access_token
route.put('/shop_wxlite/:appid/access_token_resume', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		// 获取该店铺的 access_token
		return wxlite.getAuthorizerInfo(appid).then(function ({authorization_info}) {
			let {authorizer_refresh_token} = authorization_info
			return wxlite.getAuthorizerAccessToken(appid, authorizer_refresh_token).then(function (accessToken) {
				let authorizer_access_token = accessToken.authorizer_access_token
				return authorizerCache.getAuthorization(appid).then(function (cacheData) {
					cacheData.authorizer_access_token = authorizer_access_token
					// 存放到 redis 中
					return authorizerCache.putAuthorization(appid, cacheData).then(function () {
						return cacheData
					})
				})
			})
		}).then(function (cacheData) {
			resp.json(cacheData)
		})
	}, errorlog);
})

route.post('/shop_wxlite', function (req, resp) {
	req.checkBody('authorizerAppid', 'body 上的 authorizerAppid 必须存在').notEmpty();
	req.checkBody('appKey', 'body 上的 appKey 必须存在').notEmpty();
	req.checkBody('appName', 'body 上的 appName 必须存在').notEmpty();
	req.checkBody('version', 'body 上的 version 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		shopApi.createAuthorizer(req.body).then(resp.json.bind(resp));
	});
});

route.get('/wxlite_qrcode/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		wxlite.getQrcode(appid).then(function (res) {
			resp.type('jpeg');
			resp.status(200).send(res);
		})
	});
});

route.get('/code', function (req, resp) {
	req.checkQuery('template_type', 'url 上的 template_type 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {template_type} = req.query;
		wxcodeApi.firstCodeByType(parseInt(template_type, 10)).then(resp.json.bind(resp))
	})
});

route.put('/change_visit/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req).then(function () {
		let {appid} = req.params;
		toggleVisible(appid).then(function (res) {
			resp.json({ visible: res })
		})
	});
})

route.put('/code_commit', function (req, resp) {
	req.checkQuery('version', 'url 上的 version 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {version} = req.query;
		shopApi.findAutoCommitAuthorizers().then(function (shops) {
			return Promise.all(shops.map(function (shop) {
				return rabbitmq.publish2(ROUTING_KEYS.Hercules_WxliteCodeCommit, {
					authorizerAppid: shop.authorizerAppid,
					version
				})
			}))
		}).then(function (res) {
			resp.json({ ok: true, count: res.length })
		})
	})
});

route.put('/shop_wxlite/:appid/bind_testers', function (req, resp) {
	req.checkParams('appid', 'appid 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		return shopApi.getAuthorizerByAppid(appid).then( shop => {
			return wxlite.bindTesters(appid, union(plInfo.testers, shop.testers))
		}).then(function (res) {
			resp.json(res)
		}, errorlog)
	})
})

route.put('/code_commit/:appid', function (req, resp) {
	req.checkParams('appid', 'appid 上的 appid 必须存在').notEmpty();
	function _refResp (res) {
		return resp.json({ templateType: res.code.templateType, templateId: res.code.templateId, testers: res.shop.testers, version: res.code.version, errcode: res.errcode, errmsg: res.errmsg });
	}
	jsonAutoValid(req, resp).then(function () {
		let {type} = req.query;
		let {appid} = req.params;
		// 流水线版本
		if (type === 'line') {
			wxlite.codeCommit(appid, false).then(_refResp);
		}
		// 仅提交，不做域名，和绑定者的覆盖
		else if (type === 'preview') {
			wxlite.codeCommit(appid, false, true).then(_refResp);
		}
		else {
			resp.status(400).json({ ok: false, err_msg: 'type invalid' })
		}
	})
});

// 代码审核
route.put('/code_submitaudit/:appid', function (req, resp) {
	req.checkParams('appid', 'appid 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		shopApi.getAuthorizerByAppid(appid)
			.then(function ({lastCommitVersion}) {
				return wxcodeApi.getByVersionNumber(lastCommitVersion)
			})
			.then(function (code) {
				return rabbitmq.publish2(publisherChannel, "yth.rd3", ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
					authorizerAppid: appid,
					version: code.version
				})
			})
			.then(function () {
				resp.json({ errcode: 0 })
			}, function (err) {
				resp.json({ errcode: -1, errmsg: err.message })
			})
	})
});

/**
 * doc : https://booteam.pubu.im/apps/integrations/59283d44a059285529eadc00
 * 触发带有callbackUrl的按钮时，将会以POST的形式将以下数据发送到callbackUrl：
 * {
 *  "action": "action_name"
 *  "team_id": "54ae274e24536700005f398f"
 *  "channel_id": "54ae48ec41c5a000006a21ab"
 *  "channel_name: "机器人"
 *  "user_name": "hfcorriez"
 *  "user_id": "54ae48ec41c5a000006a34fg",
 *  "timestamp": 1427860473.665
 *  "type": "action"
 * }
 */
route.post('/pubuim/shops/:appid/code', function (req, resp) {

	// valid rules
	req.checkBody('type', 'type required and string in body').notEmpty();
	req.checkBody('action', 'action required and string in body').notEmpty();
	req.checkParams('appid', 'appid required and string in params').notEmpty();
	req.checkQuery('version', 'version required and string in query').notEmpty();

	/**
	 * 返回以下形式的数据将会在时间线里生成一条新的消息：
	 * {
   	 *    "text": "文本",
     *    "attachments": [{
     *      "title": "标题",
     *       "description": "描述",
     *       "url": "链接",
     *       "color": "warning|info|primary|error|muted|success"
     *    }],
     *    "username": "应用名称",
     *    "icon_url": "头像地址",
     *    "buttons": []
     * }
	 */

	// 参数验证成功
	jsonAutoValid(req, resp).then(function validOk () {

		let {type, action} = req.body
		let {appid} = req.params
		let {version} = req.query

		getAuthorizerBy({appid}).then(function (shop) {

			let successReply = function (action) {
				return function () {
					resp.json({
						text: `${shop.shopName} - ${action}成功`,
						icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
						username: '樱桃火'
					})
				}
			};

			let failReply = function (action) {
				return function (err) {
					resp.json({
						text: `${shop.shopName} - ${action}失败`,
						icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
						attachments: [{
							description: err.message,
							color: 'error'
						}],
						username: '樱桃火'
					})
				}
			};

			// channel, exchangeName, routingKey, content

			if (type === 'action') {
				// 提交审核
				if (action === 'wxlite_submit_audit') {
					let actionText = '审核提交'
					rabbitmq.publish2(publisherChannel, "yth.rd3", ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
						authorizerAppid: appid,
						version
					}).then(successReply(actionText), failReply(actionText))
				}
				// 代码发布
				if (action === 'wxlite_code_release') {
					let actionText = '代码上线'
					rabbitmq.publish2(publisherChannel, "yth.rd3", ROUTING_KEYS.Hercules_WxliteCodeRelease, {
						authorizerAppid: appid
					}).then(successReply(actionText), failReply(actionText))
				}
			}
		})
	})

});

rabbitmq.start()

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createPublisher("yth.rd3", ch => { publisherChannel = ch; });
}, 5000);

// 延迟创建可复用 worker 连接
setTimeout(function () {
	// 创建自发channel
	rabbitmq.createDelayPublisher("yth.rd3.delay", ch => { delayPublisherChannel = ch; });
}, 5000);

module.exports = route;