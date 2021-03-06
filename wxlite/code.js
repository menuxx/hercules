const {shopApi, wxcodeApi} = require('../leancloud');
const {wxliteApi} = require('../wxopenapi');
const wxlite = require('../wxlite');
const {log, errorlog} = require('../logger')('wxlite_code_api')
const {getAuthorizerToken} = require('./util');

const makeCommitInfo = function ({code, shop}, usDebug = false) {
	// TODO 参考 https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1489140610_Uavc4&token=&lang=zh_CN
	// accessToken, templateId, extJson, version, desc
	let {version, desc, templateId} = code;
	let _shopCodeConfig = {
		extAppid: shop.authorizerAppid,
		ext: shop.config,
		networkTimeout: {
			request: 10000,
			downloadFile: 10000
		}
	};
	if ( usDebug ) {
		return {
			templateId, version, desc,
			extJson: JSON.stringify(_shopCodeConfig)
		}
	} else {
		return {
			templateId, version, desc,
			extJson: JSON.stringify(Object.assign({
				debug: true,
				extEnable: true
			}, _shopCodeConfig))
		}
	}
};

// 同步 提交的 代码版本号
export const syncCommitAppVersion = function (authorizerAppid, code) {
	return shopApi.getAuthorizerConfig(authorizerAppid).then(function (config) {
		config.appVersion = code.version
		return shopApi.putAuthorizerFieldByAppid(authorizerAppid, 'config', config)
	})
}

/**
 * 预览代码提交
 * onlyCommit, 只提交代码，
 * 不做 域名覆盖, 测试者覆盖
 */
export const codeCommit = function (authorizer_appid, onlyCommit = true, usDebug = false) {
	let p = Promise.all([
			getAuthorizerToken(authorizer_appid),
			shopApi.getAuthorizerByAppid(authorizer_appid)
	])
	.then(function (res) {
		let accessToken = res[0], shop = res[1];
		return wxcodeApi.firstCodeByType(shop.templateType)
			.then(function (code) {
				return syncCommitAppVersion(authorizer_appid, code).then(function () {
					return {code, accessToken, shop}
				})
			});
	});
	if (!onlyCommit) {
		// 覆盖 domains
		p
			.then(function (res) {
				let {shop} = res;
				// 绑定所有体验者
				return Promise.all([
					wxlite.setDomains(authorizer_appid, shop.domains)
				]).then(function () { return res })
			})
	}
	return p
		.then(function (res) {
			let data = { accessToken: res.accessToken, ...makeCommitInfo(res, usDebug) }
			return wxliteApi.wxCommit(data)
				.then(function (res0) {
					shopApi.putAuthorizerFieldByAppid(authorizer_appid, 'lastCommitVersion', res.code.version);
					return Object.assign(res0, res)
				});
		});
};

export const codeRelease = function (authorizer_appid) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return wxliteApi.wxRelease({accessToken})
	});
};

export const submitAudit = function (authorizer_appid) {
	return Promise.all([
		getAuthorizerToken(authorizer_appid),
		shopApi.getAuthorizerByAppid(authorizer_appid)
	]).then(function (res) {
		let accessToken = res[0], shop = res[1];
		return wxliteApi.wxSubmitAudit({accessToken, itemList: shop.itemList})
	}, function (err) {
		errorlog('appid : '+ authorizer_appid +', code SubmitAudit result : ' + JSON.stringify(err))
		return err
	})
};

export const getCategory = function (authorizer_appid) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return wxliteApi.wxGetCategory({accessToken});
	});
};

export const getPage = function (authorizer_appid) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return wxliteApi.wxGetPage({accessToken});
	})
}

export const changeVisit = function (authorizer_appid, isOpne) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return wxliteApi.wxChangeVisitStatus({accessToken, isOpne})
	})
}