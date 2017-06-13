const {wxliteApi} = require('../wxopenapi')
const {getAuthorizerToken} = require('./util');

// accessToken, requestDomains, wsRequestDomains, uploadDomains, downloadDomains
export const cleanDomains = function (authorizer_appid) {
	return getAuthorizerToken(authorizer_appid).then(function (authorizer_access_token) {
		return wxliteApi.wxDeleteDomain({
			accessToken: authorizer_access_token,
			requestDomains: [],
			wsRequestDomains: [],
			uploadDomains: [],
			downloadDomains: []
		})
	});
}

export const setDomains = function (authorizer_appid, domains) {
	return getAuthorizerToken(authorizer_appid).then(function (authorizer_access_token) {
		return wxliteApi.wxSetDomain({
			accessToken: authorizer_access_token,
			...domains
		})
	});
}