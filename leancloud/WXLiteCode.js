const AV = require('leancloud-storage')
const {isEmpty} = require('lodash')
/**
 * 小程序代码 Class
 *
 * struct :
 * {
 *  gitBranch: '3rdcomponent',
 *  gitTag: '0.1.4',
 *  gitUrl: 'https://git.coding.net/yin80871901/menuxx-wxlite.git',
 *  version: '0.1.4',
 *  templateId: 0,
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
const WXLiteCode = AV.Object.extend('WXLiteCode');

const query = new AV.Query('WXLiteCode');

function reflectWXLiteCodeObject(object) {
	if (isEmpty(object)) {
		return null;
	}
	return {
		createdAt: object.createdAt,
		updatedAt: object.updatedAt,
		gitBranch: object.get('gitBranch'),
		gitTag: object.get('gitTag'),
		gitUrl: object.get('gitUrl'),
		version: object.get('version'),
		templateType: object.get('templateType'),
		templateId: object.get('templateId'),
		desc: object.get('desc'),
		_config: object.get('_config'),
		_domains: object.get('_domains'),
		id: object.id
	}
}

export const firstCodeByType = function (templateType) {
	var query = new AV.Query('WXLiteCode');
	query.equalTo('templateType', templateType);
	query.addDescending('createdAt');
	return query.first().then(reflectWXLiteCodeObject);
};

export const findCodeByType = function (templateType, limit) {
	var query = new AV.Query('WXLiteCode');
	query.equalTo('templateType', templateType);
	query.addDescending('createdAt');
	query.limit(limit);
	return query.find().then(function (codes) {
		return codes.map(reflectWXLiteCodeObject)
	});
};

export const getByVersionNumber = function (version) {
	query.equalTo('version', version);
	query.addDescending('createdAt');
	return query.first().then(reflectWXLiteCodeObject);
};

export const saveCode = function (code) {
	var wxCode = new WXLiteCode();
	wxCode.set('gitBranch', code.gitBranch);
	wxCode.set('gitTag', code.gitTag);
	wxCode.set('gitUrl', code.gitUrl)
	wxCode.set('version', code.version)
	wxCode.set('templateId', code.templateId)
	wxCode.set('templateType', code.templateType)
	wxCode.set('desc', code.desc)
	wxCode.set('_config', code._config)
	wxCode.set('_domains', code._domains)
	return wxCode.save();
};


