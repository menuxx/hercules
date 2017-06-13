// https://github.com/NodeRedis/node_redis
// https://hub.docker.com/_/redis/
const redisFactory = require("redis")
// https://github.com/petkaantonov/bluebird Promise
const bluebird = require('bluebird')
const {redis} = require('../config')
const {log, errorlog} = require('../logger')('redis')
const {assign} = require('lodash')

// 为 redis 添加 Promise 支持
bluebird.promisifyAll(redisFactory.RedisClient.prototype)
bluebird.promisifyAll(redisFactory.Multi.prototype)

module.exports = function ({dbIndex}) {

  var credis = redisFactory.createClient(assign({db : dbIndex}, redis));

  credis.on("error", function (err) {
      errorlog("[Radis] Error ", err)
  });

  ['connect', 'reconnecting'].forEach(function (event) {
    credis.on(event, function () {
      log(`[Radis] dbIndex %d ${event}`, dbIndex)
    })
  })

  return credis

}