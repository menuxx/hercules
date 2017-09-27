const {log, errorlog} = require('../logger')('menuxx-api');
const rp = require('request-promise');
const {menuxx} = require('../config');

const post = function (uri, payload) {
	let fullUrl = menuxx.baseUrl + uri;
	log('post url: %s, data: %o', fullUrl, payload);
	rp({
		method: 'POST',
		uri: fullUrl,
		body: payload,
		json: true
	})
};

const get = function (uri) {
	let fullUrl = menuxx.baseUrl + uri;
	log('get url: %s', fullUrl);
	return rp({
		method: 'GET',
		uri: fullUrl,
		json: true
	})
};

export const getShops = function () {
	return get('/authorizers')
};