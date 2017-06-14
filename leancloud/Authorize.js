
const AV = require('leancloud-storage');

const Authorize = AV.Object.extend('Authorize');

export const logAuthorized = function ({ componentAppid, authorizerAppid, actionTime, authorizationCode }) {
	let authorize = new Authorize();
	authorize.set('componentAppid', componentAppid);
	authorize.set('authorizerAppid', authorizerAppid);
	authorize.set('authorizationCode', authorizationCode)
	authorize.set('actionTime', actionTime);
	return authorize.save();
};

export const logUnauthorize = function ({ componentAppid, authorizerAppid, actionTime }) {
	let authorize = new Authorize();
	authorize.set('componentAppid', componentAppid);
	authorize.set('authorizerAppid', authorizerAppid);
	authorize.set('actionTime', actionTime);
	return authorize.save();
};