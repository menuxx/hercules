var {isEmpty} = require('lodash')

var filterEmpty = function (arr) {
	return arr.filter(function (item) {
		return !isEmpty(item)
	})
}

var wechatArgumentConvert = function (config) {
	config.appid = config.componentAppid
	config.appSecret = config.componentAppSecret
	return config
}

module.exports = {
	code: {
		versionNum: '0.0.1',
		codeId: '86a833f'
	},
	loggers: {
		fundebug: filterEmpty((process.env.LOGGER_FUNDEBUG || '').split(',')),
		console: filterEmpty((process.env.LOGGER_CONSOLE || '').split(',')),
		file: filterEmpty((process.env.LOGGER_FILE || '').split(','))
	},
	plInfo: {
		name: '菜单加',
		contactPhone: '13575762817',
		testers: ['yin80871901', 'susoft2008', 'xph970828'],  // 测试者
		testPhone: '13575762817',
		enable: false	// 是否启用短信
	},
	// 微信开放平台
	wxOpen: wechatArgumentConvert({
		componentAppid: process.env.WX_3RD_APP_ID,      // component_appid
		componentAppSecret: process.env.WX_3RD_APP_SECRET,  // component_appsecret
		appKey: process.env.WX_3RD_APP_KEY,
		token: process.env.WX_3RD_APP_TOKEN,
		encodingAESKey: process.env.WX_3RD_ENCODING_AES_KEY,
		checkSignature: true // 可选，默认为true。由于微信公众平台接口调试工具在明文模式下不发送签名，所以如要使用该测试工具，请将其设置为false
	}),
	// 荣联云短信
	ronglian: {
		accountSid: process.env.RONGLIAN_ACCOUNT_SID,
		authToken: process.env.RONGLIAN_AUTH_TOKEN,
		appId: process.env.RONGLIAN_APP_ID
	},
	rabbit: {
		uri: process.env.RABBIT_URI_01
	},
	auth: {
		username: process.env.AUTH_USERNAME,
		password: process.env.AUTH_PASSWORD
	},
	redis: {
		port: parseInt(process.env.REDIS_01_PORT, 10),
		host: process.env.REDIS_01_HOSTNAME,
		password: process.env.REDIS_01_PASSWORD
	},
	leancloud: {
		appId: process.env.LEANCLOUD_APPID,
		appKey: process.env.LEANCLOUD_APPKEY,
		masterKey: 'ugBbaGFOXc0VCJlKcUDNJGcN'
	},
	server: {
		port: process.env.PORT || 8081,
		siteUrl: process.env.SITE_URL
	},
	menuxx: {
		baseUrl: process.env.MENUXX_BASE_URL
	},
	urls: {
		getAuthorizerUrl: process.env.URL_GET_AUTHORIZE,
		putAuthorizerUrl: process.env.URL_PUT_AUTHORIZE
	}
}