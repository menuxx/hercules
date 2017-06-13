
const AV = require('leancloud-storage');

const Authorize = AV.Object.extend('Authorize');

export const unauthorizeLog = function ({ componentAppid, authorizerAppid, unauthorizeTime }) {
	let authorize = new Authorize();
	authorize.set('componentAppid', componentAppid);
	authorize.set('authorizerAppid', authorizerAppid);
	authorize.set('unauthorizeTime', unauthorizeTime);
	return authorize.save();
};