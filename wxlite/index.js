const {componentCacheGet} = require('../components/cache');
const {wx3rdApi} = require('../wxopenapi')

module.exports = {};
Object.assign(module.exports, require('./code'));
Object.assign(module.exports, require('./qrcode'));
Object.assign(module.exports, require('./member'));
Object.assign(module.exports, require('./url'));

function getAuthorizerInfo(authorizer_appid) {
	return componentCacheGet().then(function ({component_access_token}) {
		return wx3rdApi.wxGetAuthorizerInfo({
			authorizerAppid: authorizer_appid,
			componentAccessToken: component_access_token
		})
	})
}

function getAuthorizerList(offset, count) {
	return componentCacheGet().then(function ({component_access_token}) {
		return wx3rdApi.getAuthorizerList({
			offset,
			count,
			componentAccessToken: component_access_token
		})
	})
}

function getAuthorizerAccessToken(authorizer_appid, refresh_token) {
	return componentCacheGet().then(function ({component_access_token}) {
		return wx3rdApi.wxRefreshApiAuthorizerToken({
				componentAccessToken: component_access_token,
				authorizerAppid: authorizer_appid,
				authorizerRefreshToken: refresh_token
		})
	})

}



module.exports.getAuthorizerInfo = getAuthorizerInfo;

module.exports.getAuthorizerList = getAuthorizerList;

module.exports.getAuthorizerAccessToken = getAuthorizerAccessToken;