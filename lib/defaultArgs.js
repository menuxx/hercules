
// doc : https://github.com/serkanyersen/kwargsjs
const kwargs = require('kwargsjs')

module.exports = function (initVals) {
  var hash = {}
  // 初始化 参数 绑定
  Object.assign(hash, initVals)
  return function defaultArgs (fn) {
    return fn.kwargs(hash)
  }
}