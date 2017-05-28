const {Router} = require('express')
const log = require('debug')('route:info')
const logerror = require('debug')('route:error')
const {getDiners, getDinerByAppId} = require('../db/diners')
const session = require('../components/session')
const passport = require('passport')
const {BasicStrategy} = require('passport-http')
const {auth, appId} = require('../config')
const {isEmpty} = require('lodash')
const route = Router()
const {wxGetAuthorizeUrl, wxQueryAuth} = require('../wxapi/componentApi')
const {tokenCache, wxCache} = require('../components/cache')
const {errorPage} = require('../lib/error')
const {delayRefresh} = require('../components/rabbitmq')
const bb = require('bluebird')

passport.use(new BasicStrategy(function(username, password, cb) {
  if (username === auth.username && password === auth.password) {
    cb(null, {username})
  } else {
    cb(new Error('账号密码错误'))
  }
}))

route.use(session)

route.get('/commit_fail', function (req, resp) {
  
  resp.render('commit_fail', { title: '代码发布失败' })
})

route.get('/submit_audit_fail', function (req, resp) {

  resp.render('submit_audit_fail', { title: '代码审核失败' })
})

route.get('/diners', passport.authenticate('basic', { session: false }), 
  function(req, resp) {
    bb.all([
      tokenCache.getPreAuthCode(),
      getDiners()
    ])
    .then(function(results) {
      var preAuthCode = results[0], diners = results[1]
      // 筛选出只有 appId 的商户
      diners = diners.filter(function(item) {
        return !isEmpty(item.app_id)
      }).map(function(item){
        item.authorize_url = wxGetAuthorizeUrl(appId, preAuthCode, `http://wx1.qurenjia.com/wx/3rd/authorize/${item.app_id}`)
        return item
      })
      resp.render('diners', { diners, title: '可授权店铺列表' })
    })
})

route.get('/wx/3rd/authorize/:appid', function(req, resp) {
  var {appid} = req.params
  var {auth_code} = req.query

  if (isEmpty(auth_code) || isEmpty(appid)) {
    return errorPage(resp, '小程序授权请求无效')
  }

  bb
  .all([
    tokenCache.getComponentAccessToken(),
    tokenCache.getPreAuthCode()
  ])
  .then(function(res) {
    var componentAccessToken = res[0]
    return wxQueryAuth(appId, componentAccessToken, auth_code)
  })
  .then(function({authorization_info}) {
    var {authorizer_appid, authorizer_refresh_token} = authorization_info
    // 全部完成后
    return bb.all([
      wxCache.putAuthorizerInfo(appid, authorization_info)
      ,
      // 发送延迟消息，到刷新令牌队列
      // appId, authorizer_appid, authorizer_refresh_token
      delayRefresh(appid, authorizer_appid, authorizer_refresh_token)
    ])
  })
  .then(function() {
    // 获取单个店铺的信息
    return getDinerByAppId(appid)
  })
  .then(function(diner) {
    if (isEmpty(diner)) {
      return errorPage(resp, '授权的店铺不存在')
    }
    resp.render('authorize_success', { title: '授权成功', diner })
  }, function(err) {
    logerror('get diner by app_id fail', err)
    errorPage(resp, '授权的店铺不存在')
  })

})

module.exports = route