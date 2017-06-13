const {authorizerCache} = require('../components/cache')
/**
 * 获取 authorizer_access_token
 */
export const getAuthorizerToken = function (appid) {
	return authorizerCache.getAuthorizerInfo(appid).then(function ({authorizer_access_token}) {
		return authorizer_access_token;
	});
}