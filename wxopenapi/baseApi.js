// https://github.com/request/request-promise
const rp = require('request-promise')
const {has} = require('lodash')

module.exports = function (moduleName, baseApi) {

	const {log, errorlog} = require('../logger')(moduleName)

	const get = function (apiUrl) {
		var fullUrl = baseApi + apiUrl
		log('weixin [%s] request url: %s, body: %o', moduleName, fullUrl)
		return rp({
			method: 'GET',
			uri: fullUrl,
			json: true
		})
			.then(function (res) {
				if (has(res, 'errcode') && has(res, 'errmsg')) {
					return Promise.reject(res)
				}
				log('weixin [%s] response url: %s, body %o', moduleName, fullUrl, res)
				return res
			})
			.catch(function (err) {
				errorlog('wxapi [%s] error', moduleName, fullUrl, err)
				return err
			})
	}

	const post = function (apiUrl, body) {
		var fullUrl = baseApi + apiUrl
		log('weixin %s request url: %s, body: %o', moduleName, fullUrl, body)
		return rp({
			method: 'POST',
			uri: fullUrl,
			body: body,
			json: true
		})
			.then(function (res) {
				if (has(res, 'errcode') && has(res, 'errmsg')) {
					return Promise.reject(res)
				}
				log('weixin %s response url: %s, body: %o', moduleName, fullUrl, res)
				return res
			})
			.catch(function (err) {
				errorlog('wxapi [%s] error', moduleName, fullUrl, err)
				return err
			})
	}
	return {post, get}
}