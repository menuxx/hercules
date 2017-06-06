const moment = require('moment')

export const timestamp = function () {
  return Math.round(Date.now() / 1000)
}

export const timeformat = function (format) {
  return moment(new Date()).format(format)
}