/**
 * 提交审核日志 Class
 * {
 *    auditid         :  5368259,   // 审核 id
 *    version         :  '0.1.1',   // 发布版本号
 *    authorizerAppid :  'wx833943b167b4012a',  // 账户 appid
 *    codeId          :  '5937f6922f301e005884e565',  // 关联的 代码 id
 * }
 **/

const AV = require('leancloud-storage');

const SubmitAuditLog = AV.Object.extend('SubmitAuditLog');
const query = new AV.Query('SubmitAuditLog');

export const log = function (data) {
	var audit = new SubmitAuditLog();
	audit.set('auditid', data.auditid);
	audit.set('version', data.version);
	audit.set('authorizerAppid', data.authorizerAppid);
	audit.set('codeId', data.codeId);
	return audit.save();
};

function reflectWXLiteCodeObject(object) {
	return {
		auditid: object.get('auditid'),
		version: object.get('version'),
		authorizerAppid: object.get('authorizerAppid'),
		codeId: object.get('codeId'),
		id: object.id
	};
}

// 最近的一次审核提交
export const getNewest = function (authorizer_appid) {
	query.query('authorizerAppid', authorizer_appid);
	query.addDescending('createdAt');
	return query.first().then(reflectWXLiteCodeObject);
};