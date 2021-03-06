const {Router} = require('express');
const {log, errorlog} = require('../logger')('pageshandler');
const {fetchAuthorizer, putAuthorizerBy, getAuthorizerBy, menuxx} = require('../service');
const session = require('../components/session');
const {webNotify} = require('../components/webhook');
const passport = require('passport');
const {BasicStrategy} = require('passport-http');
const {auth} = require('../config');
const {wx3rdApi} = require('../wxopenapi');
const {tokenCache, authorizerCache} = require('../components/cache');
const {errorPage} = require('../lib/error');
const {autoValid} = require('../lib/params');
const wxlite = require('../wxlite');
const {wxcodeApi} = require('../leancloud')
const util = require('util');
const {siteUrl} = require('../config').server;

const route = Router();

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

route.get('/wx3rd/codes', passport.authenticate('basic', {session: false}),
	function (req, resp) {
		autoValid(req, resp).then(()=>{
			Promise.all([1, 2, 3].map((type) => wxcodeApi.findCodeByType(type, 6))).then(function (codeGroup) {
				let codesTypeOfSingle = codeGroup[0]
				let codesTypeOfSingleLarge = codeGroup[1]
				let codesTypeOfPlatform = codeGroup[2]
				resp.render("codes", {
					codesTypeOfSingle,
					codesTypeOfSingleLarge,
					codesTypeOfPlatform
				})
			}, function (err) {
				errorlog(err)
				resp.json(err)
			})
		});
})

route.get('/shops/:appkey', passport.authenticate('basic', {session: false}),
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
			}).then(function (res) {
				resp.render('authorizer', { categoryList: res[0].category_list, pageList: res[1].page_list, ...res[2], authorizerInfo: res[3] });
			}, function (err) {
				console.log(err)
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
		let offset = (pagenum - 1) * pagesize;
		wxlite.getAuthorizerList(offset, pagesize).then(function ({total_count, list}) {
			let _pre_pagenum = pagenum <= 1 ?  1 : pagenum - 1;
			resp.render('wxauthorizers', { authorizers: list, total: total_count, _next_pagenum: pagenum + 1, _pre_pagenum })
		})
	})
});

route.get('/shops', passport.authenticate('basic', {session: false}), function (req, resp) {
	menuxx.getShops()
	.then(function (authorizers) {
		resp.render('shops', {authorizers, title: '可授权店铺列表'})
	}, errorlog)
});

route.get('/wx3rd/authorize/:appkey', function (req, resp) {
	req.checkQuery('auth_code', 'url 上的 auth_code 必须存在').notEmpty(); // 安全授权码.. 这里暂时没用
	req.checkParams('appkey', 'url 上的 appkey 必须存在').notEmpty();
	autoValid(req, resp).then(() => {
		let {auth_code} = req.query; // 安全授权码
		let {appkey} = req.params;
		Promise.all([
			getAuthorizerBy({appkey}),
			tokenCache.getComponentAccessToken()
		]).then((res) => {
			let shop = res[0], componentAccessToken = res[1]
			return wx3rdApi.wxQueryAuth({componentAccessToken, authCode: auth_code}).then(({authorization_info}) => {
				let {authorizer_appid} = authorization_info
				return wx3rdApi.wxGetAuthorizerInfo({componentAccessToken, authorizerAppid: authorizer_appid}).then(({authorizer_info}) => {
					// 更新订单，绑定 appkey 与 appid 之间的关系
					return putAuthorizerBy(webNotify, {appkey}, {authorizerAppid: authorizer_appid}).then(()=>{return { shop, authorizer_info }})
				})
			})
		}).then(function ({shop, authorizer_info}) {
			resp.render('authorize_success', {title: '授权成功', info: authorizer_info, shop})
		}, function (err) {
			errorlog(err);
			errorPage(resp, '授权的店铺不存在');
		})
	});

});

module.exports = route;