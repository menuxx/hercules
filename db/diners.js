
const {defer} = require('q')
const {isEmpty} = require('lodash')
const {prod_pool, dev_pool} = require('./index')

export const getDiners = function() {
  var deferred = defer()
  prod_pool.getConnection(function (err, conn) {
    conn.query(`select id, corp_name, authorizer_app_id, logo_path,
      legal_entity, shop_name, master_name, address, corp_phone, 
      email, master_phone, wechat_id, app_id
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

export const getDinerByAppId = function(appId) {
  var deferred = defer()
  prod_pool.getConnection(function (err, conn) {
    conn.query(`select id, corp_name, authorizer_app_id, logo_path,
      legal_entity, shop_name, master_name, address, corp_phone, 
      email, master_phone, wechat_id, app_id
      from t_corp where app_id = ?`, [appId],
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

export const updateDinerAuthorizerAppId = function (appId, authorizerAppId) {
  var deferred = defer()
  prod_pool.getConnection(function(err, conn) {
    conn.query(`update t_corp set authorizer_app_id = ? where app_id = ?`, [authorizerAppId, appId], function(error, results, fields) {
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