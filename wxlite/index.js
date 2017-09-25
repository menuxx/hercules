const {tokenCache} = require('../components/cache');
const {wx3rdApi} = require('../wxopenapi')

module.exports = {};
Object.assign(module.exports, require('./code'));
Object.assign(module.exports, require('./qrcode'));
Object.assign(module.exports, require('./member'));
Object.assign(module.exports, require('./url'));

function getAuthorizerInfo(authorizerAppid) {
	return tokenCache.getComponentAccessToken().then(componentAccessToken => {
		return wx3rdApi.wxGetAuthorizerInfo({
			authorizerAppid, componentAccessToken
		})
	})
}

function getAuthorizerList(offset, count) {
	return tokenCache.getComponentAccessToken().then(componentAccessToken =>  {
		return wx3rdApi.getAuthorizerList({
			offset,
			count,
			componentAccessToken
		})
	})
}

function getAuthorizerAccessToken(authorizerAppid, refreshToken) {
	return tokenCache.getComponentAccessToken().then(componentAccessToken => {
		return wx3rdApi.wxRefreshApiAuthorizerToken({
				componentAccessToken,
				authorizerAppid,
				authorizerRefreshToken: refreshToken
		})
	})
}

function getPreAuthCode() {
	return tokenCache.getComponentAccessToken().then(componentAccessToken => {
		return wx3rdApi.wxGetPreAuthCode({
			componentAccessToken
		})
	})
}

module.exports.getPreAuthCode = getPreAuthCode

module.exports.getAuthorizerInfo = getAuthorizerInfo;

module.exports.getAuthorizerList = getAuthorizerList;

module.exports.getAuthorizerAccessToken = getAuthorizerAccessToken;