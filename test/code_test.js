const {wxcodeApi} = require('../leancloud')

/**
 * {
 *  gitBranch: '3rdcomponent',
 *  gitTag: '0.1.4',
 *  gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
 *  version: '0.1.4',
 *  templateId: 0,
 *  templateType: 1,	// 平台版
 *  desc: '修复了一些bug, 提高了稳定性',
 *  _config: {
 *    apiBaseurl: 'https://api.menuxx.com/',
 *    cdnBaseurl: 'https://file.menuxx.com',
 *    fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
 *  },
 *  _domains: {
 *    requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com'],
 *    wsRequestDomains: ['wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
 *    uploadDomains: ['https://file.menuxx.com'],
 *    downloadDomains: ['https://file.menuxx.com']
 *  }
 * }
 oB1f90J-lBQzk0SiTvKbCGvfD2CY
 wx984ee7ec5f76f9cf
 1409172302
 */

wxcodeApi.saveCode({
	gitBranch: 'tpl_single_01',
	gitTag: 'tpl_single_0_1_12',
	gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
	version: 'v0.1.13',
	templateId: 8,
	templateType: 1,
	desc: 'extjson 确认发布',
	_config: {
		apiBaseurl: 'https://dev.api.menuxx.com/',
		cdnBaseurl: 'https://file.menuxx.com',
		fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
	},
	_domains: {
		requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com'],
		wsRequestDomains: ['wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
		uploadDomains: ['https://file.menuxx.com'],
		downloadDomains: ['https://file.menuxx.com']
	}
}).then(function (res) {
	console.log(res.id)
})

wxcodeApi.firstCodeByType(1).then(function (a) {
	console.log(a)
})