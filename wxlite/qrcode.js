const {wxliteApi} = require('../wxopenapi')
const {getAuthorizerToken} = require('./util');
const {siteUrl} = require('../config').server

export const getQrcode = function (authorizer_appid) {
  return getAuthorizerToken(authorizer_appid)
  .then(function (accessToken) {
    return wxliteApi.wxGetQrcode({ accessToken })
  });
};

export const getQrcodeUrl = function (authorizer_appid) {
  return siteUrl + '/api/wxlite_qrcode/' + authorizer_appid
}