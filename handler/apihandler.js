const {Router} = require('express')
const {makeError} = require('../lib/error')
const errorlog = require('debug')('api:error')
const {wxlite} = require('../wxopenapi')
const {fetchDiner} = require('../service')
const log = require('debug')('api')
const {autoValid} = require('../lib/params')
const {componentCacheGet, componentCacheSave} = require('../components/cache')
const route = Router()

route.get('/component_cache', function(req, resp) {
  componentCacheGet().then(function (values) {
    resp.json(values)
  }, function(err) {
    errorlog(err)
    resp.status(500).json(makeError(err, 500, err.message))
  })
})

/**
 * doc : https://booteam.pubu.im/apps/integrations/59283d44a059285529eadc00
 * 触发带有callbackUrl的按钮时，将会以POST的形式将以下数据发送到callbackUrl：
 * {
 *  "action": "action_name"
 *  "team_id": "54ae274e24536700005f398f"
 *  "channel_id": "54ae48ec41c5a000006a21ab"
 *  "channel_name: "机器人"
 *  "user_name": "hfcorriez"
 *  "user_id": "54ae48ec41c5a000006a34fg",
 *  "timestamp": 1427860473.665
 *  "type": "action"
 * }
 */
route.post('/diners/:appid/code', function (req, resp) {

  // valid rules
  req.checkBody('type', 'type required and string in body').notEmpty().isString()
  req.checkBody('action', 'action required and string in body').notEmpty().isString()
  req.checkBody('channel_name', 'channel_name required and string in body').notEmpty().isString()

  req.checkParams('appid', 'appid required and string in params').notEmpty().isString()

  /**
   * 返回以下形式的数据将会在时间线里生成一条新的消息：
   * {
   *    "text": "文本",
   *    "attachments": [{
   *      "title": "标题",
   *       "description": "描述",
   *       "url": "链接",
   *       "color": "warning|info|primary|error|muted|success"
   *    }],
   *    "username": "应用名称",
   *    "icon_url": "头像地址",
   *    "buttons": []
   * }
   */

  // 参数验证成功
  autoValid(req).then(function validOk() {

    var {type, action, channel_name} = resp.body
    var {appid} = req.params
    
    var successReply = function (action) {
      return function (diner) {
        resp.json({
          text: `${diner.shopName} - ${action}成功`,
          icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
          username: '菜单加'
        })
      }
    }

    var failReply = function (action) {
      return function (err) {
        resp.json({
          text: `${diner.shopName} - ${action}失败`,
          icon_url: 'https://file.menuxx.com/image/menuxx-logo-mini.png',
          attachments: [
            description: err.errorMsg,
            color: 'error'
          ],
          username: '菜单加'
        })
      }
    }

    if (type === 'action') {
      // 提交审核
      if (action === 'wxlite_submit_audit') {
        let actionText = '审核提交'
        fetchDiner(appid)
        .then(function (diner) {
          return wxlite.wxSubmitAudit(diner.auth).then(function (res) {
            return Object.assign({}, res, diner)
          })
        })
        .then(successReply(actionText), failReply(actionText))
      }
      // 代码发布
      if (action === 'wxlite_code_release') {
        let actionText = '代码上线'
        fetchDiner(appid)
        .then(wxlite.wxRelease).then(successReply(actionText), failReply(actionText))
      }
    }
  })

})

module.exports = route