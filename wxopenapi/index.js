
const wxconfig = require('../config').wxOpen;
require('./defaultArgs')(wxconfig);

exports.wxliteApi = {};

exports.wx3rdApi = {};

exports.wxApi = {};

// 微信小程序 管理接口
[
  require('./wxlite/codeManage'),
  require('./wxlite/urlManage'),
  require('./wxlite/memberManage')
].forEach(function (module) {
  Object.assign(exports.wxliteApi, module)
});


// 微信 第三方 管理接口
[
  require('./wxcomponent/3rd')
].forEach(function (module) {
  Object.assign(exports.wx3rdApi, module)
});


// 微信 第一版本 api
[
  require('./wxv1/custom_msg')
].forEach(function (module) {
  Object.assign(exports.wxApi, module)
});