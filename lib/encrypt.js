
const crypto = require('crypto')

const hash = function (algor, str) {
  return crypto.createHash(algor).update(str).digest('hex')
}

export const sha1 = function (str) {
  return hash('sha1', str)
}

export const md5 = function (str) {
  return hash('md5', str)
}

export const base64 = function (str) {
  return new Buffer(str).toString('base64')
}