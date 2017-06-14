const AV = require('leancloud-storage')
const {has, isEmpty} = require('lodash')

/**
 * 商户小程序应用 Class
 * struct :
 * {
 *    authorizerAppid: 'wx833943b167b4012a',
 *    appKey: 'D560776C-C374-461C-A522-EC315BD3DA3C',
 *    version: '0.1.1',
 *    appName: '芝根芝底披萨餐厅转塘店',
 *    templateType: 1,
 *    originAppId: 'gh_8c862bd1194f',  // 小程序原始 id
 *    corpId: 1,
 *    platformCorpId: 4,
 *    autoCommit: true, // 是否自动提交代码
 *    autoRelease: true,  // 是否自动化发布
 *    autoSubmitAudit: true, // 是否自动提交审核
 *    lastCommitVersion: '0.1.2',
 *    config: {
 *      codeVersion: '0.1.1',
 *      appName: '芝根芝底披萨餐厅转塘店',
 *      corpId: 1,
 *      platformCorpId: 4,
 *      apiBaseurl: 'https://api.menuxx.com/',
 *      cdnBaseurl: 'https://file.menuxx.com/',
 *      fundebugApikey: '337b61f714201cbc40911fcb17a19a16e54399e26d68497f0a8681a999c66909'
 *    },
 *    itemList: [
 *      {
 *      "address": "index",
 *      "tag": "学习 生活",
 *      "first_class": "文娱",
 *      "second_class": "资讯",
 *      "title": "首页"
 *     },
 *     {
 *      "address": "page/logs/logs",
 *      "tag":"学习 工作",
 *      "first_class": "教育",
 *      "second_class": "学历教育",
 *      "third_class": "高等",
 *      "title": "日志"
 *      }
 *    ],
 *    testers: ['yin80871901', 'susoft2008'],
 *    domains: {
 *      requestDomains: ['https://dev.api.menuxx.com', 'https://api.menuxx.com', 'https://menuxx-xcx-log.wilddogio.com'],
 *      wsRequestDomains: ['wss://dev.message.menuxx.com', 'wss://message.menuxx.com'],
 *      uploadDomains: ['https://file.menuxx.com'],
 *      downloadDomains: ['https://file.menuxx.com']
 *    }
 * }
 **/

const ClassName = 'DinerWXLite';

const DinerWXLite = AV.Object.extend(ClassName);

const query = new AV.Query(ClassName);

function reflectDinerWXLiteObject(object) {
	if ( isEmpty(object) ) {
		return null;
	}
	return {
		authorizerAppid: object.get('authorizerAppid'),
		appKey: object.get('appKey'),
		appName: object.get('appName'),
		version: object.get('version'),
		autoCommit: object.get('autoCommit', false),
		autoRelease: object.get('autoRelease', false),
		autoSubmitAudit: object.get('autoSubmitAudit', false),
		templateType: object.get('templateType'),
		appOriginId: object.get('originAppId'),
		corpId: object.get('corpId'),
		platformCorpId: object.get('platformCorpId'),
		config: object.get('config'),
		domains: object.get('domains'),
		testers: object.get('testers'),
		itemList: object.get('itemList'),
		_objectId: object.id
	}
}

export const getAuthorizerByAppid = function (appid) {
	query.equalTo('authorizerAppid', appid);
	return query.first().then(reflectDinerWXLiteObject);
};

export const findAutoCommitAuthorizers = function () {
	query.equalTo('autoCommit', true);
	return query.find().then(function (results) {
		return results.map(reflectDinerWXLiteObject).filter(function (obj) {
			return !isEmpty(obj)
		})
	})
}

export const putAuthorizerFieldByAppid = function (appid, field, data) {
	query.equalTo('authorizerAppid', appid);
	return query.first().then(function (diner) {
		var obj = AV.Object.createWithoutData(DinerWXLite, diner.id);
		obj.set(field, data);
		return obj.save();
	})
};

export const saveAuthorizer = function (appid, data) {
	query.equalTo('authorizerAppid', appid);
	return query.first().then(function (diner) {
		let dinerObj = AV.Object.createWithoutData(ClassName, diner.id);
		dinerObj.set('authorizerAppid', data.authorizerAppid)
		dinerObj.set('appKey', data.appKey)
		dinerObj.set('appName', data.appName)
		dinerObj.set('version', data.version)      // 小程序当前版本号
		dinerObj.set('templateType', data.templateType)
		dinerObj.set('originAppId', data.originAppId)
		if (has(data, 'corpId')) dinerObj.set('corpId', data.corpId);
		if (has(data, 'platformCorpId')) dinerObj.set('platformCorpId', data.platformCorpId);
		dinerObj.set('autoCommit', data.autoCommit || false)
		dinerObj.set('autoSubmitAudit', data.autoSubmitAudit || false)
		dinerObj.set('autoRelease', data.autoRelease || false)
		dinerObj.set('config', data.config)
		dinerObj.set('itemList', data.itemList)
		dinerObj.set('testers', data.testers)
		dinerObj.set('domains', data.domains)
		return dinerObj.save();
	});
};

export const createAuthorizer = function (data) {
	var diner = new DinerWXLite();
	diner.set('authorizerAppid', data.authorizerAppid)
	diner.set('appKey', data.appKey)
	diner.set('appName', data.appName)
	diner.set('version', data.version)      // 小程序当前版本号
	diner.set('templateType', data.templateType)
	diner.set('originAppId', data.originAppId)
	if (has(diner, 'corpId')) diner.set('corpId', data.corpId);
	if (has(diner, 'platformCorpId')) diner.set('platformCorpId', data.platformCorpId);
	diner.set('autoCommit', data.autoCommit || false)
	diner.set('autoSubmitAudit', data.autoSubmitAudit || false)
	diner.set('autoRelease', data.autoRelease || false)
	diner.set('config', data.config)
	diner.set('itemList', data.itemList)
	diner.set('testers', data.testers)
	diner.set('domains', data.domains)
	return diner.save();
};

export const getAuthorizerByOriginAppId = function (appid) {
	query.equalTo('originAppId', appid);
	return query.first().then(reflectDinerWXLiteObject);
};





