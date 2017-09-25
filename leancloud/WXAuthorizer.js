const AV = require('leancloud-storage');
const {isEmpty} = require('lodash')

// 系统授权
const WXAuthorizer = AV.Object.extend('WXAuthorizer');
const query = new AV.Query('WXAuthorizer');

function reflectObject(object) {
	return {
		appId: object.get('appId'),
		logoUrl: object.get('logoUrl'),
		primaryName: object.get('primaryName'),
		businessName: object.get('businessName'),
		qrcodeUrl: object.get('qrcodeUrl'),
		refreshToken: object.get('refreshToken'),
		authorized: object.get('authorized'),
		createdAt: object.createdAt,
		updatedAt: object.updatedAt,
		id: object.id
	};
}

export const save = function ({ appId, logoUrl, primaryName, businessName, qrcodeUrl, refreshToken, authorized }) {
	query.equalTo('appId', appId);
	return query.first().then(function (authorizer) {
		// 没有就创建，否则更新
		if (isEmpty(authorizer)) {
			let authorizerObj = new WXAuthorizer()
			authorizerObj.set('appId', appId)
			authorizerObj.set('logoUrl', logoUrl)
			authorizerObj.set('primaryName', primaryName)
			authorizerObj.set('businessName', businessName)
			authorizerObj.set('qrcodeUrl', qrcodeUrl)
			authorizerObj.set('refreshToken', refreshToken)
			authorizerObj.set('authorized', authorized)
			return authorizerObj.save().then(reflectObject)
		} else {
			console.log('=============')
			let authorizerObj = AV.Object.createWithoutData('WXAuthorizer', authorizer.id);
			authorizerObj.set('appId', appId)
			authorizerObj.set('logoUrl', logoUrl)
			authorizerObj.set('primaryName', primaryName)
			authorizerObj.set('businessName', businessName)
			authorizerObj.set('qrcodeUrl', qrcodeUrl)
			authorizerObj.set('refreshToken', refreshToken)
			authorizerObj.set('authorized', authorized)
			return authorizerObj.save().then(reflectObject)
		}
	})
};

export const updateRefreshToken = function (appid, refreshToken) {
	query.equalTo('appId', appid);
	return query.first().then(function (authorizer) {
		let authorizerObj = AV.Object.createWithoutData('WXAuthorizer', authorizer.id);
		authorizerObj.set('refreshToken', refreshToken)
		return authorizerObj.save();
	});
};

export const updateUnauthorize = function (appid) {
	query.equalTo('appId', appid);
	return query.first().then(function (authorizer) {
		let authorizerObj = AV.Object.createWithoutData('WXAuthorizer', authorizer.id);
		authorizerObj.set('authorized', false)
		return authorizerObj.save();
	});
};

export const updateByAppId = function (appid, data) {
	query.equalTo('appId', appid);
	return query.first().then(function (authorizer) {
		let authorizerObj = AV.Object.createWithoutData('WXAuthorizer', authorizer.id);
		authorizerObj.set('appId', data.appId)
		authorizerObj.set('logoUrl', data.logoUrl)
		authorizerObj.set('primaryName', data.primaryName)
		authorizerObj.set('businessName', data.businessName)
		authorizerObj.set('qrcodeUrl', data.qrcodeUrl)
		authorizerObj.set('refreshToken', data.refreshToken)
		authorizerObj.set('authorized', data.authorized)
		return authorizerObj.save();
	});
};

export const getByAppId = function (appId) {
	query.query('appId', appId);
	query.addDescending('createdAt');
	return query.first().then(reflectObject);
}