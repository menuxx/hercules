
const AV = require('leancloud-storage');

const Authorize = AV.Object.extend('Authorize');

export const logAuthorized = function ({ componentAppid, authorizerAppid, authorizationCode, primaryName }) {
	let authorize = new Authorize();
	authorize.set('componentAppid', componentAppid);
	authorize.set('authorizerAppid', authorizerAppid);
	authorize.set('authorizationCode', authorizationCode)
	authorize.set('primaryName', primaryName)
	return authorize.save();
};

export const logUnauthorize = function ({ componentAppid, authorizerAppid, primaryName }) {
	let authorize = new Authorize();
	authorize.set('componentAppid', componentAppid);
	authorize.set('authorizerAppid', authorizerAppid);
	authorize.set('primaryName', primaryName)
	return authorize.save();
};