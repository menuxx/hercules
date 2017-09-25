const AV = require('leancloud-storage')
const {leancloud} = require('../config')

AV.init(leancloud);

exports.authorizerApi = require('./WXAuthorizer');
exports.shopApi = require('./DinerWXLite');
exports.wxcodeApi = require('./WXLiteCode');
exports.authorizeApi = require('./Authorize');
exports.submitAuditLogApi = require('./SubmitAuditLog');
exports.auditLogApi = require('./AuditLog');