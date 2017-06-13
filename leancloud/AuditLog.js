/**
 * 小程序 审核日志 Class
 * 
 * 审核失败
 * struct:
 * {
 *    createTime: 1488856741,
 *    failTime : 1488856591,
 *    reason   : '1:账号信息不符合规范:<br>
 * (1):包含色情因素<br>
 * 2:服务类目"金融业-保险_"与你提交代码审核时设置的功能页面内容不一致:<br>
 * (1):功能页面设置的部分标签不属于所选的服务类目范围。<br>
 * (2):功能页面设置的部分标签与该页面内容不相关。<br>',
 *    authorizerAppid    : 'wx833943b167b4012a',  // 关联的 用户 appid
 *    submitId :  '543745419728372387cv34879532',   // 审核提交 id
 * }
 * 
 * 审核成功
 * struct:
 * {
 *    succTime : 1488856741,
 *    createTime: 1488856591,
 *    submitId :  '543745419728372387cv34879532',   // 审核提交 id
 *    authorizerAppid: 'wx833943b167b4012a',    // 关联的 用户 appid
 * }
 **/

const AV = require('leancloud-storage');
const AuditLog = AV.Object.extend('AuditLog');
const {has} = require('lodash');

export const log = function (_log) {
	let log = new AuditLog();
	log.set('authorizerAppid', _log.authorizerAppid);
	log.set('createTime', _log.createTime);
	log.set('submitId', _log.submitId);
	if (has(_log, 'failTime') || has(_log, 'reason')) {
		// fail
		log.set('type', 'fail');
		log.set('failTime', _log.failTime);
		log.set('reason', _log.reason);
	} else {
		log.set('type', 'success');
		log.set('succTime', _log.succTime);
	}
	return log.save();
};