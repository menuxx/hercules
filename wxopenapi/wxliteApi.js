const rp = require('request-promise');
const moduleName = 'wxlite_api';
const baseApi = 'https://api.weixin.qq.com/wxa/';
const {log} = require('../logger')(moduleName)

export const errorMap = {
  '-1': '系统繁忙',
  
  '85001': '微信号不存在或微信号设置为不可搜索',
  '85002': '小程序绑定的体验者数量达到上限',
  '85003': '微信号绑定的小程序体验者达到上限',
  '85004': '微信号已经绑定',

  '85022': 'action非法',
  '85021': '状态不可变',
  '85019': '没有审核版本',
  '85020': '审核状态未满足发布',

  '86000': '不是由第三方代小程序进行调用',
  '86001': '不存在第三方的已经提交的代码'
};

export const bindTesterErrorMsg = function(errorCode) {
  var errMsg = errorMap[errorCode + ''];
  if (errMsg) {
    return errMsg
  };
  return '未知的错误'
};

export const getfile = function (uri) {
  var fullUrl = baseApi + uri;
  log('get file %s', fullUrl);
  return rp({
    method: 'GET',
    uri: fullUrl,
    encoding: null
  });
};

Object.assign(exports, require('./baseApi')(moduleName, baseApi));