/** 
 * 微信消息路由 routingKey
 * InfoType=component_verify_ticket
 * MsgType=event&Event=weapp_audit_success
 * usage: 
 * WXMsgRouter('MsgType=event&Event=weapp_audit_success', function (msg, req, resp) {
 *    
 * })
 */

const qs = require('querystring')

const WXMsgRoute = function (routingKey, callback) {
  var opts = qs.parse(routeOpts.routingKey)
}