const {log, errorlog} = require('../logger')('wxhandler');
// doc : https://github.com/node-webot/wechat
const wechat = require('wechat');
const wxconfig = require('../config').wxOpen;
// 平台配置
const {tokenCache} = require('../components/cache');
const {Router} = require('express');
const {appPublish} = require('../components/rabbitmq');
const {wxApi, wx3rdApi} = require('../wxopenapi');
const {InfoTypes} = wx3rdApi;
const {ROUTING_KEYS} = require('../mqworks');
const {isEmpty, has} = require('lodash');

const route = Router();

// 验证 消息 api
// doc1 : https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1419318611&lang=zh_CN
// doc2 : http://www.07net01.com/2017/01/1770019.html
// 第三方信息 Api 验证
/**
 * url :  /wx/3rd/wxd101a85aa106f53e/callback?
 *      signature=80f328952ca60312cc6eefe43e3913c3dfe92c60&
 *      timestamp=1496461028&nonce=1556906150&
 *      openid=oV6P70DM0-NBLoiQKb2JISwLhR80&encrypt_type=aes&
 *      msg_signature=79189b427da6755dd2240cca76304a57b9eb4880
 *
 * msg :
 * {
 *    ToUserName: 'gh_8dad206e9538',
 *    FromUserName: 'oV6P70DM0-NBLoiQKb2JISwLhR80',
 *    CreateTime: '1496461028',
 *    MsgType: 'text',
 *    Content: 'QUERY_AUTH_CODE:queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
 *    MsgId: '6427251175451672521'
 * }
 *
 * 自动化测试的专用测试小程序的信息如下：
 *（1）appid：wxd101a85aa106f53e
 *（2）Username： gh_8dad206e9538
 */

const WX_TEST_LITE_VERIFY_APPID = 'wxd101a85aa106f53e'; // 微信小程序测试 AppId
const WX_TEST_LITE_USERNAME = 'gh_8dad206e9538'; // 微信小程序测试 UserName

// 验证消息Api
// msg.ToUserName == WX_TEST_LITE_USERNAME
const verifyMsgApi = function (msg, resp) {
	log('verify-msg-api', '- start -');
	let {Content} = msg;
	resp.send('');
	let queryAuthCode = Content.replace('QUERY_AUTH_CODE:', '');
	return tokenCache.getComponentAccessToken()
		.then( componentAccessToken => {
			return wx3rdApi.wxQueryAuth({accessToken: componentAccessToken, authCode: queryAuthCode})
		})
		.then(function ({authorization_info}) {
			let {authorizer_access_token} = authorization_info;
			let sendContent = (queryAuthCode + '_from_api');
			return wxApi.wxSendText(authorizer_access_token, msg.FromUserName, sendContent)
		})
};

/**
 * doc : https://open.weixin.qq.com/cgi-bin/showdocument?action=dir_list&t=resource/res_list&verify=1&id=open1453779503&token=&lang=zh_CN
 *
 * url : /wx/3rd/notify?signature=0d565e505c560a4c1e5b814674182f68cfefbeb6
 *      &timestamp=1496461020&nonce=805459633&encrypt_type=aes
 *      &msg_signature=8e5a1cc3e9152f0f00fd0a50e568f3197474a1a2
 * msg :
 *  {
 *    AppId: 'wxb3d033d520d15fe7',
 *    CreateTime: '1496461020',
 *    InfoType: 'authorized',
 *    AuthorizerAppid: 'wxd101a85aa106f53e',
 *    AuthorizationCode: 'queryauthcode@@@x4BhekqBmEo3mSUXr6eu3g4xnKLlG4zK6QXJRJTP_F5Kk5Olu2PxjswYSdRuAi2Ydj4cpMHExaBVJeyrMMa8IQ',
 *    AuthorizationCodeExpiredTime: '1496464620'
 *  }
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       authorized是授权成功通知
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 *
 * 授权成功通知
 * <xml>
 *   <AppId>第三方平台appid</AppId>
 *   <CreateTime>1413192760</CreateTime>
 *   <InfoType>authorized</InfoType>
 *   <AuthorizerAppid>公众号appid</AuthorizerAppid>
 *   <AuthorizationCode>授权码（code）</AuthorizationCode>
 *   <AuthorizationCodeExpiredTime>过期时间</AuthorizationCodeExpiredTime>
 * </xml>
 **/

/**
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       updateauthorized是更新授权
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 *
 * 授权更新通知
 * <xml>
 *  <AppId>第三方平台appid</AppId>
 *  <CreateTime>1413192760</CreateTime>
 *  <InfoType>updateauthorized</InfoType>
 *  <AuthorizerAppid>公众号appid</AuthorizerAppid>
 *  <AuthorizationCode>授权码（code）</AuthorizationCode>
 *  <AuthorizationCodeExpiredTime>过期时间</AuthorizationCodeExpiredTime>
 * </xml>
 **/

/**
 *
 * url :  /wx/3rd/notify?signature=3e3913451936b865c9409e307fd5fa8d834108e6&timestamp=1496461034&nonce=2120938598&encrypt_type=aes&msg_signature=71d49f8eb081fd260406b7d7017c49f71dc9ee95
 * msg :  { AppId: 'wxb3d033d520d15fe7',
 * CreateTime: '1496461034',
 * InfoType: 'unauthorized',
 * AuthorizerAppid: 'wxd101a85aa106f53e' }
 *
 * 字段说明：
 * 字段名称                         字段描述
 * AppId                          第三方平台appid
 * CreateTime                     时间戳
 * InfoType                       unauthorized是取消授权
 * AuthorizerAppid                公众号或小程序
 * AuthorizationCode              授权码，可用于换取公众号的接口调用凭据，详细见上面的说明
 * AuthorizationCodeExpiredTime   授权码过期时间
 * 取消授权通知
 * <xml>
 *  <AppId>第三方平台appid</AppId>
 *  <CreateTime>1413192760</CreateTime>
 *  <InfoType>unauthorized</InfoType>
 *  <AuthorizerAppid>公众号appid</AuthorizerAppid>
 * </xml>
 */

/**
 * url :  /wx/3rd/notify?signature=a5bd2c7f5ef89b5b18a703964157a96474a040ca&timestamp=1496461523&nonce=260040557&encrypt_type=aes&msg_signature=cab074cd1ed07bfecc9012b4912eb4249d9f958d
 * msg :
 *  { 
 *    AppId: 'wxb3d033d520d15fe7',
 *    CreateTime: '1496461523',
 *    InfoType: 'component_verify_ticket',
 *    ComponentVerifyTicket: 'ticket@@@aglquGhXj06i8hOe_sTqW2enDJoI8pxH7xL-FcDOTbbjKLePiWEwr9kehVf5Oz6JDIlhk_BLsTuNw6Je-ifuVg'
 *  }
 *
 * 处理微信第三方验证票据
 * 推送component_verify_ticket协议
 * 在第三方平台创建审核通过后，微信服务器会向其
 * “授权事件接收URL”每隔10分钟定时推送component_verify_ticket。
 * 第三方平台方在收到ticket推送后也需进行解密（详细请见【消息加解密接入指引】），接收到后必须直接返回字符串success。
 * POST数据示例
 * <xml>
 *   <AppId></AppId>
 *   <CreateTime>1413192605</CreateTime>
 *   <InfoType>component_verify_ticket</InfoType>
 *   <ComponentVerifyTicket></ComponentVerifyTicket>
 * </xml>
 *
 * 字段说明
 * 字段名称                字段描述
 * AppId                 第三方平台appid
 * CreateTime            时间戳
 * InfoType              component_verify_ticket
 * ComponentVerifyTicket Ticket内容
 **/

// 处理微信第三方验证票据
// const handleComponentAccessToken = function ({ComponentVerifyTicket, AppId}, req, resp) {
// appPublish(ROUTING_KEYS.Hercules_UpdateAccessToken, {
// 	verifyTicket: ComponentVerifyTicket,
// 	appId: AppId
// }).then(function () {
// 	resp.send('SUCCESS');
// }, function (err) {
// 	errorlog('handleComponentAccessToken error: %o', err);
// 	resp.send('FAIL');
// });
// };

// // 处理授权更新
// const handleUpdateAuthorized = function ({AppId, AuthorizerAppid, AuthorizationCode}, resp) {
// 	appPublish(ROUTING_KEYS.WX_UpdateAuthorize, {
// 		appId: AppId,
// 		authorizerAppid: AuthorizerAppid,
// 		authorizationCode: AuthorizationCode
// 	}).then(function () {
// 		resp.send('SUCCESS');
// 	}, function (err) {
// 		errorlog('handleUpdateAuthorized error: %o', err);
// 		resp.send('FAIL');
// 	});
// };


// 处理授权更新
// const handleAuthorize = function ({AppId, AuthorizerAppid, AuthorizationCode}, resp) {
// 	// 消息延迟一秒发送到目标消费者
// 	// 已提供足够的时间来修改通知业务服务器，来关联 appkey 和 appid
// 	appDelayPublish(3000, ROUTING_KEYS.WX_Authorized, {
// 		appId: AppId,
// 		authorizerAppid: AuthorizerAppid,
// 		authorizationCode: AuthorizationCode
// 	}).then(function () {
// 		resp.send('SUCCESS');
// 	}, function (err) {
// 		errorlog('handleAuthorize error: %o', err);
// 		resp.send('FAIL');
// 	});
// };

// const handleUnAuthorize = function ({AppId, AuthorizerAppid, CreateTime}, resp) {
// 	appPublish(ROUTING_KEYS.WX_UnAuthorize, {
// 		appId: AppId,
// 		authorizerAppid: AuthorizerAppid,
// 		createTime: CreateTime
// 	}).then(function () {
// 		resp.send('SUCCESS');
// 	}, function (err) {
// 		errorlog('handleAuthorize error: %o', err);
// 		resp.send('FAIL');
// 	});
// };

// // 授权事件接收URL
// route.post('/3rd/notify', wechat(wxconfig, function (req, resp) {
// 	let msg = req.weixin;
// 	if ( !has(msg, 'InfoType') || isEmpty(msg.InfoType) ) {
// 		return resp.status(401).send('FAIL');
// 	}
// 	log('weixin notify InfoType : %s', msg.InfoType);
// 	switch (msg.InfoType) {
// 		// 取消授权
// 		case InfoTypes.UNAUTHORIZED:
// 			handleUnAuthorize(msg, resp);
// 			break;
// 		// 授权成功
// 		case InfoTypes.AUTHORIZED:
// 			handleAuthorize(msg, resp);
// 			break;
// 		// 授权更新
// 		case InfoTypes.UPDATEAUTHORIZED:
// 			handleUpdateAuthorized(msg, resp);
// 			break;
// 		// 验证票据
// 		case InfoTypes.COMPONENT_VERIFY_TICKET:
// 			handleComponentAccessToken(msg, req, resp);
// 			break;
// 		default:
// 			resp.send('SUCCESS');
// 	}
// 	resp.send('SUCCESS');
// }));

const wxlitePublish = function (routingKey, data) {
	return appPublish('yth3rd', routingKey, data)
}

const handleWeappAuditSuccess = function ({AppId, CreateTime, SuccTime}, resp) {
	wxlitePublish(ROUTING_KEYS.WX_WxliteAuditSuccess, {
		authorizerAppid: AppId,
		createTime: CreateTime,
		succTime: SuccTime
	}).then(function () {
		resp.send('SUCCESS');
	}, function (err) {
		errorlog('handleWeappAuditSuccess error: %o', err);
		resp.send('FAIL');
	})
}

const handleWeappAuditFail = function ({AppId, Reason, CreateTime, FailTime}, resp) {
	wxlitePublish(ROUTING_KEYS.WX_WxliteAuditFail, {
		authorizerAppid: AppId,
		createTime: CreateTime,
		failTime: FailTime,
		reason: Reason
	}).then(function () {
		resp.send('SUCCESS');
		// wx833943b167b4012a
	}, function (err) {
		errorlog('handleWeappAuditFail error: %o', err);
		resp.send('FAIL');
	})
}
// 公众号消息与事件接收URL
route.post('/3rd/:appid/callback', wechat(wxconfig, function (req, resp) {
	let {appid} = req.params;
	let msg = req.weixin;

	// 将 appid 附加到消息时体重
	msg.AppId = appid;

	if ( !has(msg, 'MsgType') || isEmpty(msg.MsgType) ) {
		return resp.send('FAIL');
	}
	if (msg.ToUserName === WX_TEST_LITE_USERNAME) {
		log('verify callback');
		return verifyMsgApi(msg, resp)
			.then(function (res) {
				log('verify-msg-api - ok- ')
			}, function (err) {
				errorlog('verify-msg-api - fail -', err)
			})
	}
	if (msg.MsgType === 'event') {
		switch (msg.Event) {
			case 'weapp_audit_success':
				handleWeappAuditSuccess(msg, resp);
				return;
			case 'weapp_audit_fail':
				handleWeappAuditFail(msg, resp);
				return;
			default:
		}
	}
	resp.reply('客服消息正在开发中，敬请期待...');
}));


module.exports = route;
