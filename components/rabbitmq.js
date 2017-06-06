// http://www.squaremobius.net/amqp.node/channel_api.html
const amqp = require('amqplib/callback_api')
const {rabbit, plInfo} = require('../config')
const db = require('../db')
const sms = require('./ronglian')
const info = require('debug')('rabbitmq')
const errorlog = require('debug')('rabbitmq:error')
const {authorizerRefreshToken} = require('./rabbitmq_tasks')
const {wxCache} = require('./cache')
// https://github.com/kelektiv/node-uuid
const uuid = require('uuid/v4')
const {isEmpty} = require('lodash')
const bb = require('bluebird')
const {InfoTypes} = require('../wxapi')

// 延迟队列
var delayChannel = null
// 普通队列
var qChannel = null

var amqpConn = null

var offlinePubQueue = []

// 刷新令牌队列
export const refreshTokenQueue = 'refresh_token_queue'

// 代码版本发布队列
export const codeCommitQueue = 'code_commit_queue'

// 代码提交审核队列
export const codeSubmitAuditQueue = 'code_submit_audit_queue'

// 短信延迟发布队列
export const smsSendQueue = 'sms_send_queue'

// ?heartbeat=60
const start = function () {
    amqp.connect(rabbit.uri + '?heartbeat=60', function (err, conn) {
      if (err) {
        errorlog('[AMQP connect %s]', err.message)
        // 重试一次
        return setTimeout(start, 1000)
      }
      conn.on('error', function (err) {
        if (err.message !== 'Connection closing') {
          errorlog('[AMQP] conn error %s', err.message)
        }
      })
      conn.on('close', function (err) {
        errorlog("[AMQP] reconnecting")
        return setTimeout(start, 1000)
      })
      info("[AMQP] connected")
      amqpConn = conn
      whenConnected()
    })
}

start()

function closeOnErr(err) {
  if (!err) return false
  errorlog("[AMQP] error", err)
  amqpConn.close()
  return true
}


function whenConnected () {
  // 恢复离线作业
  startDelayPublisher()
  // 启动普通作业
  startQPublisher()
  // 启动队列作业
  startDelayQueueWorkers()
}

/**
 * `createConfirmChannel` opens a channel which uses "confirmation mode". 
 * A channel in confirmation mode require each published message to be 'acked' or 'nacked' by the server, 
 * thereby indicating that it has been handled.
 * 
 * `offlinePubQueue` is an internal queue for messages that could not be sent when the application was offline. 
 * The application will check this queue and send the messages in the queue if a message is added to the queue.
 */
function startPublisher (callback) {
  amqpConn.createConfirmChannel(function (err, ch) {
    if (closeOnErr(err)) return
    ch.on('error', function (err) {
      errorlog('[AMQP] channel error %s', err.message)
    })
    ch.on('close', function() {
      info('[AMQP] channel closed')
    })
    callback(ch)
  })
}

function startDelayPublisher () {
  startPublisher(function (ch) {
    // 添加 延迟 支持
    // 使用 错误 恢复 的 publish 方法
    require('./rabbitmq_delay')(ch, {publish})
    delayChannel = ch
    while (true) {
      var m = offlinePubQueue.shift()
      if (!m) break
      publish(ch, m[0], m[1], m[2])
    }
  })
}

function startQPublisher () {
  startPublisher(function (ch) {
    // 添加 延迟 支持
    // 使用 错误 恢复 的 publish 方法
    qChannel = ch
    while (true) {
      var m = offlinePubQueue.shift()
      if (!m) break
      publish(ch, m[0], m[1], m[2])
    }
  })
}


/**
 * The publish function will publish a message to an exchange with a given routing key. 
 * If an error occurs the message will be added to the internal queue, offlinePubQueue
 */
function publish(channel, exchange, routingKey, content) {
  var deferred = bb.defer()
  try {
    channel.publish(exchange, routingKey, content, { persistent: true }, function (err, ok) {
      if (err) {
        deferred.reject(err)
        errorlog('[AMQP publish]', err)
        offlinePubQueue.push([exchange, routingKey, content])
        channel.connection.close()
      } else {
        deferred.resolve()
      }
    })
  } catch (e) {
    errorlog('[AMQP publish] %s', err.message)
    offlinePubQueue.push([exchange, routingKey, content])
    deferred.reject(e)
  }
  return deferred.promise
}

// A worker that acks messages only if processed successfully
function startWorker(queueName, workCallback) {
  amqpConn.createChannel(function (err, ch) {
    if (closeOnErr(err)) return
    ch.on('error', function (err) {
      errorlog('[AMQP] channel error %s', err.message)
    })
    ch.on('close', function () {
      info('[AMQP] channel closed')
    })
    ch.prefetch(10)
    ch.assertQueue(queueName, { durable: true }, function (err, _ok) {
      if (closeOnErr(err)) return
      ch.consume(queueName, processMsg, { noAck: false })
      info('[AMQP] queue %s Worker is started', queueName)
    })
    function processMsg(msg) {
      workCallback(msg, ch, function(ok, status=true) {
        try {
          if (ok) {
            ch.ack(msg)
          } else {
            ch.reject(msg, status)
          }
        } catch (e) {
          closeOnErr(e)
        }
      })
    }
  })
}

function startDelayQueueWorkers() {
  // 短信延迟发送队列
  startWorker(smsSendQueue, function (msg, ch, ackCallback) {
    info('recive sms message')
    if (msg !== null) {
      // msg app_key, authorizer_appid, sms_type
      var {app_key, sms_type} = JSON.parse(msg.content.toString())
      var sendCallback
      // 各种短信发送
      if (sms_type == InfoTypes.UNAUTHORIZED) {
        sendCallback = function ({master_phone, master_name, shop_name}) {
          return sms.sendAuthorizedSMS(master_phone, [master_name, shop_name])
        }
      }
      else if (sms_type == InfoTypes.AUTHORIZED) {
        sendCallback = function ({master_phone, master_name, shop_name}) {
          return sms.sendUnauthorizedSMS(master_phone, [master_name, shop_name, plInfo.contactPhone])
        }
      }
      else if (sms_type == InfoTypes.UPDATEAUTHORIZED) {
        sendCallback = function ({master_phone, master_name, shop_name}) {
          return sms.sendUpdateauthorizedSMS(master_phone, [master_name, shop_name, plInfo.contactPhone])
        }
      } else {
        sendCallback = function ({master_phone, master_name, shop_name}) {
          return sms.sendAuthorizedSMS(master_phone, [master_name, shop_name])
        }
      }
      return db.diners.getDinerByAppKey(app_key)
      .then(sendCallback)
      .then(function () {
        info('send authorized sms ok ...')
        ackCallback(true)
      }, function () {
        // 保留并重新发送
        ackCallback(false, true)
      })
    }
  })

  // 令牌刷新队列
  startWorker(refreshTokenQueue, function (msg, ch, ackCallback) {
    info('recive delay_refresh_token message')
    if (msg !== null) {
      // 解析数据
      var data = JSON.parse(msg.content.toString())
      return wxCache.getRefreshTokenMsgId(data.appId).then(function(msgId) {
        info('current refresh_token_msg_id: %s, message id: %s', msgId, data.refresh_token_msg_id)
        // 与商家绑定的令牌消息ID不一致 丢弃消息
        if ( isEmpty(data.refresh_token_msg_id) || data.refresh_token_msg_id != msgId) {
          info('reject message id : %s', data.refresh_token_msg_id)
          // 拒接，并删除消息
          ackCallback(false, false)
          return bb.resolve(msg)
        }
        // 开始刷新令牌
        info('start refresh_token ....', data)
        return authorizerRefreshToken(data)
        // 重新发布 延迟 更新消息 到队列
        .then(function({appId, authorizer_appid, authorizer_refresh_token}) {
          info('refresh_token done ...')
          return delayRefresh(appId, authorizer_appid, authorizer_refresh_token)
        })
        // 成功后确认成功
        .then(function () {
          info('ask confirm ok ...')
          // 消息处理中
          ackCallback(true)
        })
      })
    }
  })
}
// 当应用关闭之前， 断开连接，释放资源
process.on('exit', (code) => {
  info(`rabbotmq exit: ${code}`)
  delayChannel.close()
  qChannel.close()
  connection.disconnect()
})

// appId 商家的 appId
// 发布令牌刷新消息
export const delayRefresh = function (appId, authorizer_appid, authorizer_refresh_token) {
  // 过期时间是 7200 ,但是应为系统间各种延迟 所以 需要更宽的过期时间。
  // 6000 秒后， 微信 token 过期时间 7200 秒
  // 1200 秒作为系统所有延迟时间消耗
  info('delay refresh token message publish')
  // 生成消息 id 并且绑定到，对应的 店铺 appId 上面
  var msgId = uuid()
  return wxCache.putRefreshTokenMsgId(appId, msgId).then(function() {
    var msg = new Buffer(JSON.stringify({ refresh_token_msg_id: msgId, appId, authorizer_appid, authorizer_refresh_token }))
    // 6000 秒后发送
    return delayChannel.delay(1000 * 6000).publish('', refreshTokenQueue, msg)
  })
}

export const sendSMSQ = function (authorizer_appid, sms_type) {
  info('send sms message publish')
  var msg = new Buffer(JSON.stringify({ authorizer_appid, sms_type }))
  // 5 秒后发送
  return delayChannel.delay(1000 * 5).publish('', smsSendQueue, msg)
}

// 小程序代码提交队列
export const commit = function (authorizer_appid, authorizer_access_token) {
  
}

// 小程序代码审核队列
export const submitAudit = function () {

}






