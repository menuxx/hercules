
const {isEmpty} = require('lodash')

export const isProd = function () {
  if ( isEmpty(process.env.NODE_ENV) ) {
    return false
  }
  return process.env.NODE_ENV === 'production'
}