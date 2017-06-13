
export const ROUTING_KEYS = {
	WX_Authorized: 'wx.authorized', // 用户授权
	WX_UnAuthorize: 'wx.unauthorize', // 用户取消授权
	WX_UpdateAuthorize: 'wx.updateauthorize', //用户更新授权
	WX_ComponentVerifyTicket: 'wx.component_verify_ticket', // 验证票据
	WX_WxliteAuditSuccess: 'wx.wxlite.audit_success',  // 小程序审核成功
	WX_WxliteAuditFail: 'wx.wxlite.audit_fail',  // 小程序审核失败
	Hercules_UpdateAccessToken: 'hercules.update_access_token', // 更新 component_access_token
	Hercules_UpdateAccessTokenSuccess: 'hercules.update_access_token.success', // 更新 component_access_token 成功
	Hercules_WxliteCodeCommit: 'hercules.wxlite.code_commit', // 微信小程序代码提交
	Hercules_WxliteSubmitAudit: 'hercules.wxlite.code_submit_audit', // 微信小程序代码提交审核
	Hercules_WxliteCodeRelease: 'hercules.wxlite.code_release', // 微信小程序代码发布上线
	Hercules_RefershAccessToken: 'hercules.refersh_authorizer_access_token' // 启动自刷新循环
};