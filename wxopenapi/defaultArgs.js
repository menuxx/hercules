
const defaultArgsContainer = require('../lib/defaultArgs')

var _defaultArgs = function () {}

module.exports = function ({componentAppid, componentAppSecret, appKey}) {
  module.exports.defaultArgs = defaultArgsContainer(
    {componentAppid, componentAppSecret, appKey}
  )
}