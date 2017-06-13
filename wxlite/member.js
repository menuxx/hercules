const {wxliteApi} = require('../wxopenapi')
const {getAuthorizerToken} = require('./util');

function bindTester({tester, accessToken}) {
	return wxliteApi
		.wxBindTester({wechatid: tester, accessToken})
		.then(null, function (err) {
			// 如果该用户已经绑定过，忽略该错误
			if (err.errcode === 85004) {
				return Promise.resolve({errcode: 0, errmsg: 'ok'});
			}
		})
}
// 可同时绑定多个体验者
export const bindTesters = function (authorizer_appid, testers=[], ignoreAlreadyBinded = true) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return Promise.all(testers.map(function (tester) {
			return ignoreAlreadyBinded ? bindTester({
				wechatid: tester,
				accessToken
			}) : wxliteApi.wxBindTester({wechatid: tester, accessToken})
		}));
	});
};

// 可同时取消绑定多个体验者
export const unbindTesters = function (authorizer_appid, testers=[]) {
	return getAuthorizerToken(authorizer_appid).then(function (accessToken) {
		return Promise.all(testers.map(function (tester) {
			return wxliteApi.wxUnbindTester({wechatid: tester, accessToken});
		}));
	});
};