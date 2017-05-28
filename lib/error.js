const debug = require('debug')('error:error')

export const makeError = function (error, errorCode, msg) {
  debug('makeError', error)
  return {
    code: errorCode,
    msg
  }
}

export const errorPage = function (resp, errMsg) {
  resp.render('error', {errMsg})
}