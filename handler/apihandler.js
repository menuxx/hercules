const {Router} = require('express');
const {makeError} = require('../lib/error');
const {log, errorlog} = require('../logger')('apihandler');
const {getAuthorizerBy} = require('../service');
const {jsonAutoValid} = require('../lib/params');
const {dinerApi, wxcodeApi} = require('../leancloud');
const {componentCacheGet} = require('../components/cache');
const wxlite = require('../wxlite');
const {ROUTING_KEYS} = require('../mqworks');
const {appPublish} = require('../components/rabbitmq');

const route = Router();

route.get('/component_cache', function (req, resp) {
	componentCacheGet().then(function (values) {
		resp.json(values)
	}, function (err) {
		errorlog(err);
		resp.status(500).json(makeError(err, 500, err.message))
	})
});

// 保存 item_list
route.put('/dinerwxlite/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		// 不接受对 关键字段的修改
		delete req.body.authorizerAppid;
		dinerApi.saveAuthorizer(appid, req.body).then(resp.json.bind(resp));
	}, errorlog);
});

route.post('/dinerwxlite', function (req, resp) {
	req.checkBody('authorizerAppid', 'body 上的 authorizerAppid 必须存在').notEmpty();
	req.checkBody('appKey', 'body 上的 appKey 必须存在').notEmpty();
	req.checkBody('appName', 'body 上的 appName 必须存在').notEmpty();
	req.checkBody('version', 'body 上的 version 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		dinerApi.createAuthorizer(req.body).then(resp.json.bind(resp));
	});
});

route.get('/wxlite_qrcode/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req).then(function () {
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

route.put('/code_commit', function (req, resp) {
	req.checkQuery('version', 'url 上的 version 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {version} = req.query;
		dinerApi.findAutoCommitAuthorizers().then(function (diners) {
			return Promise.all(diners.map(function (diner) {
				return appPublish(ROUTING_KEYS.Hercules_WxliteCodeCommit, {
					authorizerAppid: diner.authorizerAppid,
					version
				})
			}))
		}).then(function (res) {
			resp.json({ ok: true, count: res.length })
		})
	})
});

route.put('/code_commit/:appid', function (req, resp) {
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	function _refResp (res) {
		return resp.json({ templateType: res.code.templateType, templateId: res.code.templateId, testers: res.diner.testers, version: res.code.version, errcode: res.errcode, errmsg: res.errmsg });
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
	req.checkParams('appid', 'url 上的 appid 必须存在').notEmpty();
	jsonAutoValid(req, resp).then(function () {
		let {appid} = req.params;
		dinerApi.getAuthorizerByAppid(appid)
			.then(function ({lastCommitVersion}) {
				console.log('================ lastCommitVersion', lastCommitVersion)
				return wxcodeApi.getByVersionNumber(lastCommitVersion)
			})
			.then(function (code) {
				console.log("=============== code", code)
				return appPublish(ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
					authorizerAppid: appid,
					version: code.version
				})
			})
			.then(resp.json.bind(resp))
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
route.post('/pubuim/diners/:appid/code', function (req, resp) {

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

		getAuthorizerBy({appid}).then(function (diner) {

			let successReply = function (action) {
				return function () {
					resp.json({
						text: `${diner.shopName} - ${action}成功`,
						icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
						username: '菜单加'
					})
				}
			};

			let failReply = function (action) {
				return function (err) {
					resp.json({
						text: `${diner.shopName} - ${action}失败`,
						icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
						attachments: [{
							description: err.message,
							color: 'error'
						}],
						username: '菜单加'
					})
				}
			};

			if (type === 'action') {
				// 提交审核
				if (action === 'wxlite_submit_audit') {
					let actionText = '审核提交'
					appPublish(ROUTING_KEYS.Hercules_WxliteSubmitAudit, {
						authorizerAppid: appid,
						version
					}).then(successReply(actionText), failReply(actionText))
				}
				// 代码发布
				if (action === 'wxlite_code_release') {
					let actionText = '代码上线'
					appPublish(ROUTING_KEYS.Hercules_WxliteCodeRelease, {
						authorizerAppid: appid
					}).then(successReply(actionText), failReply(actionText))
				}
			}
		})
	})

});

module.exports = route;