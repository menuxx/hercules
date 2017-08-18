const {wxcodeApi, dinerApi} = require('../leancloud')

const {toggleVisible} = require('../service')

/*
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
 */
 //oB1f90J-lBQzk0SiTvKbCGvfD2CY
 //wx984ee7ec5f76f9cf
 //1409172302
 

// wxcodeApi.saveCode({
// 	gitBranch: 'tpl_single_01',
// 	gitTag: 'tpl_single_0_1_18',
// 	gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
// 	version: 'v0.1.18s',
// 	templateId: 22,
// 	templateType: 1,
// 	desc: '1.单店版UI瑕疵问题修复 2.首页加载方式优化',
// 	_config: {
// 		apiBaseurl: 'https://dev.api.menuxx.com/',
// 		cdnBaseurl: 'https://file.menuxx.com',
// 		fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
// 	},
// 	_domains: {
// 		requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com', 'https://fundebug.com'],
// 		wsRequestDomains: ['wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
// 		uploadDomains: ['https://file.menuxx.com'],
// 		downloadDomains: ['https://file.menuxx.com']
// 	}
// }).then(function (res) {
// 	console.log(res.id)
// })

// wxcodeApi.saveCode({
// 	gitBranch: 'tpl_large_single_02',
// 	gitTag: 'tpl_large_single_0_2',
// 	gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
// 	version: 'v0.1.18ls',
// 	templateId: 22,
// 	templateType: 3,
// 	desc: '1.单店版UI瑕疵问题修复 修复首页菜单错乱问题',
// 	_config: {
// 		apiBaseurl: 'https://dev.api.menuxx.com/',
// 		cdnBaseurl: 'https://file.menuxx.com',
// 		fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
// 	},
// 	_domains: {
// 		requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com', 'https://fundebug.com'],
// 		wsRequestDomains: ['wss://menuxx_debug.mqtt.iot.gz.baidubce.com:8884', 'wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
// 		uploadDomains: ['https://file.menuxx.com'],
// 		downloadDomains: ['https://file.menuxx.com']
// 	}
// }).then(function (res) {
// 	console.log(res.id)
// })

// wxcodeApi.saveCode({
// 	gitBranch: 'tpl_platform_01',
// 	gitTag: 'tpl_platform_0_1_15',
// 	gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
// 	version: 'v0.1.15.2p',
// 	templateId: 14,
// 	templateType: 2,
// 	desc: '一些文案优化',
// 	_config: {
// 		apiBaseurl: 'https://dev.api.menuxx.com/',
// 		cdnBaseurl: 'https://file.menuxx.com',
// 		fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
// 	},
// 	_domains: {
// 		requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com', 'https://fundebug.com'],
// 		wsRequestDomains: ['wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
// 		uploadDomains: ['https://file.menuxx.com'],
// 		downloadDomains: ['https://file.menuxx.com']
// 	}
// }).then(function (res) {
// 	console.log(res.id)
// })


//
// wxcodeApi.firstCodeByType(1).then(function (a) {
// 	console.log(a)
// })

// dinerApi.putAuthorizerFieldByAppid('wx833943b167b4012a', 'lastCommitVersion', 'v0.0.14');

// toggleVisible('wx833943b167b4012a').then(function (res) {
// 	console.log(res)
// })
