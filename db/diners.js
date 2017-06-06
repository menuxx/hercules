
const {defer} = require('q')
const {isEmpty} = require('lodash')
const {prod_pool, dev_pool} = require('./index')

// 获取商户列表
export const getDiners = function() {
  var deferred = defer()
  prod_pool.getConnection(function (err, conn) {
    conn.query(`select id, corp_name, app_key, authorizer_appid, logo_path,
      legal_entity, shop_name, master_name, address, corp_phone,
      email, master_phone, wechat_id
      from t_corp`,
      function (error, results, fields) {
        conn.release()
        if (error) {
          deferred.reject(error)
        } else {
          deferred.resolve(results)
        }
      })
  })
  return deferred.promise
}

// 获取商户详细信息
export const getDinerByAppId = function(appId) {
  var deferred = defer()
  prod_pool.getConnection(function (err, conn) {
    conn.query(`select id, corp_name, app_key, authorizer_appid, logo_path,
      legal_entity, shop_name, master_name, address, corp_phone, 
      email, master_phone, wechat_id
      from t_corp where authorizer_appid = ?`, [appId],
      function (error, results, fields) {
        conn.release()
        if (error || isEmpty(results)) {
          deferred.reject(error)
        } else {
          deferred.resolve(results[0])
        }
      })
  })
  return deferred.promise
}

// 获取商户详细信息
export const getDinerByAppKey = function(appKey) {
  var deferred = defer()
  prod_pool.getConnection(function (err, conn) {
    conn.query(`select id, corp_name, app_key, authorizer_appid, logo_path,
      legal_entity, shop_name, master_name, address, corp_phone, 
      email, master_phone, wechat_id
      from t_corp where app_key = ?`, [appKey],
      function (error, results, fields) {
        conn.release()
        if (error || isEmpty(results)) {
          deferred.reject(error)
        } else {
          deferred.resolve(results[0])
        }
      })
  })
  return deferred.promise
}

// 更新授权状态
export const updateDinerAuthorizeStatus = function (authorizerAppId, status) {
  var deferred = defer()
  prod_pool.getConnection(function(err, conn) {
    conn.query(`update t_corp set authorize_status = ? where authorizer_appid = ?`, [status, authorizerAppId], function(error, results, fields) {
        conn.release()
        if (error) {
          deferred.reject(error)
        } else {
          deferred.resolve(results)
        }
    })
  })
  return deferred.promise
}

// 更新商户 appId
export const updateDinerAuthorizerAppId = function (appKey, authorizerAppId) {
  var deferred = defer()
  prod_pool.getConnection(function(err, conn) {
    conn.query(`update t_corp set authorizer_appid = ? where app_key = ?`, [authorizerAppId, appKey], function(error, results, fields) {
        conn.release()
        if (error) {
          deferred.reject(error)
        } else {
          deferred.resolve(results)
        }
    })
  })
  return deferred.promise
}