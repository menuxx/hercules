const {Router} = require('express')
const {makeError} = require('../lib/error')
const apierror = require('debug')('api:error')
const log = require('debug')('api')
// https://github.com/jprichardson/node-jsonfile
const {isEmpty} = require('lodash')
const {componentCacheGet} = require('../components/cache')
const route = Router()

route.get('/component_cache', function(req, resp) {
  componentCacheGet().then(function(values) {
    resp.json(values)
  }, function(err) {
    apierror(err)
    resp.status(500).json(makeError(err, 500, err.message))
  })
})

module.exports = route