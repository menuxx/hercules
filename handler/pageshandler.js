const {Router} = require('express');
const {log, errorlog} = require('../logger')('pageshandler');
const {fetchAuthorizer, putAuthorizerBy, getAuthorizerBy, menuxx} = require('../service');
const session = require('../components/session');
const {webNotify} = require('../components/webhook');
const passport = require('passport');
const {BasicStrategy} = require('passport-http');
const {auth} = require('../config');
const route = Router();
const {wx3rdApi} = require('../wxopenapi');
const {tokenCache} = require('../components/cache');
const {errorPage} = require('../lib/error');
const {autoValid} = require('../lib/params');
const wxlite = require('../wxlite');
const util = require('util');
const {siteUrl} = require('../config').server;

route.use(function (req, resp, next) {
	req.locals = { siteUrl };
	next();
});

passport.use(new BasicStrategy(function (username, password, cb) {
	if (username === auth.username && password === auth.password) {
		cb(null, {username});
	} else {
		cb(new Error('账号密码错误'))
	}
}));

route.use(session);

route.get('/commit_fail', function (req, resp) {

	resp.render('commit_fail', {title: '代码发布失败'})
});

route.get('/submit_audit_fail', function (req, resp) {

	resp.render('submit_audit_fail', {title: '代码审核失败'})
});

route.get('/authorizers/:appkey', passport.authenticate('basic', {session: false}),
	function (req, resp) {
		req.checkParams('appkey', 'url 上的 appkey 必须存在').notEmpty();
		autoValid(req, resp).then(function () {
			let {appkey} = req.params;
			getAuthorizerBy({appkey})
				.then(function ({authorizerAppid}) {
					return Promise.all([
						wxlite.getCategory(authorizerAppid),
						wxlite.getPage(authorizerAppid),
						fetchAuthorizer(authorizerAppid, 7),
						wxlite.getAuthorizerInfo(authorizerAppid)
					])
			})
				.then(function (res) {
				resp.render('authorizer', { categoryList: res[0].category_list, pageList: res[1].page_list, ...res[2], authorizerInfo: res[3] });
			})
		});
});

// 控制台
route.get('/dashboard', passport.authenticate('basic', {session: false}), function (req, resp) {
	resp.render('dashboard')
});

route.get('/wxauthorizers', passport.authenticate('basic', {session: false}), function (req, resp) {
	autoValid(req, resp).then(function () {
		let {pagenum=1, pagesize=20} = req.query;
		pagenum = parseInt(pagenum, 10);
		pagesize = parseInt(pagesize, 10);
		if (pagenum < 0) pagenum = 1;
		if (pagesize > 500) pagesize = 500;
		let offset = pagenum * pagesize;
		console.log('offset, pagesize', offset, pagesize)
		wxlite.getAuthorizerList(offset, pagesize).then(function ({total_count, list}) {
			console.log(list)
			let _pre_pagenum = pagenum <= 1 ?  1 : pagenum - 1;
			resp.render('wxauthorizers', { authorizers: list, total: total_count, _next_pagenum: pagenum + 1, _pre_pagenum })
		})
	})
});

route.get('/diners', passport.authenticate('basic', {session: false}), function (req, resp) {
	Promise.all([
		tokenCache.getPreAuthCode(),
		menuxx.getDiners()
	])
	.then(function (results) {
		let preAuthCode = results[0], authorizers = results[1];
		authorizers.map(function (item) {
			item.authorizeUrl = wx3rdApi.wxGetAuthorizeUrl({
				authCode: preAuthCode,
				redirectUri: `${siteUrl}/wx/3rd/authorize/${item.appKey}`
			});
			return item
		});
		resp.render('diners', {authorizers, title: '可授权店铺列表'})
	}, errorlog)
});

route.get('/wx/3rd/authorize/:appkey', function (req, resp) {
	req.checkQuery('auth_code', 'url 上的 auth_code 必须存在').notEmpty();
	req.checkParams('appkey', 'url 上的 appkey 必须存在').notEmpty();
	autoValid(req, resp).then(function () {
		let {auth_code} = req.query;
		let {appkey} = req.params;
		getAuthorizerBy({appkey}).then(function (diner) {
			return tokenCache.getComponentAccessToken()
				.then(function (componentAccessToken) {
					return wx3rdApi.wxQueryAuth({accessToken: componentAccessToken, authCode: auth_code}).then(function ({authorization_info}) {
						let {authorizer_appid} = authorization_info;
						return { componentAccessToken,  authorizerAppid: authorizer_appid }
					});
				})
				.then(function ({ componentAccessToken,  authorizerAppid }) {
					return wx3rdApi.wxGetAuthorizerInfo({componentAccessToken, authorizerAppid}).then(function ({authorizer_info}) {
						return {authorizer_info, authorizerAppid}
					})
				})
				.then(function ({authorizer_info, authorizerAppid}) {
					// 绑定 appid 到 appkey
					return putAuthorizerBy(webNotify, {appkey}, {authorizerAppid})
						.then(function () {
							return {diner, info: authorizer_info}
						});
				})
		}).then(function (authorizer) {
			return resp.render('authorize_success', {title: '授权成功', authorizer})
		}, function (err) {
			errorlog(err);
			errorPage(resp, '授权的店铺不存在');
		})
	});

});

module.exports = route;