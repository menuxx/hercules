// https://github.com/NodeRedis/node_redis
// https://hub.docker.com/_/redis/
const redisFactory = require("redis")
// https://github.com/petkaantonov/bluebird Promise
const bluebird = require('bluebird')
const {redis} = require('../config')
const errorlog = require('debug')('redis:error')
const {assign} = require('lodash')

// 为 redis 添加 Promise 支持
bluebird.promisifyAll(redisFactory.RedisClient.prototype)
bluebird.promisifyAll(redisFactory.Multi.prototype)

module.exports = function ({dbIndex}) {

  const credis = redisFactory.createClient(assign({db : dbIndex}, redis))

  credis.on("error", function (err) {
      errorlog("Redis Error ", err)
  })

  return credis

}