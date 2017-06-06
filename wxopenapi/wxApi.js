
const moduleName = 'wx_api'

const baseApi = 'https://api.weixin.qq.com/cgi-bin/'

Object.assign(exports, require('./baseApi')(moduleName, baseApi))