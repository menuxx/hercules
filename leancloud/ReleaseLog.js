/**
 * 发布日志 Class
 * 
 * {  
 *    desc : '修复了一些bug, 提高了稳定性',
 *    version : '0.1.1',
 *    authorizerAppid : 'wx833943b167b4012a', // 关联的 用户 appid
 *    auditLogId : '5151365127051231t3r235723948',  // 关联的 审核日志 objectId
 *    releaseTime : 1488856741 // 发布时间
 * }
 **/

const AV = require('leancloud-storage');

const ReleaseLog = AV.Object.extend('ReleaseLog');

