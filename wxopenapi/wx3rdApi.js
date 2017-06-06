
const moduleName = 'wx3rd_api'

const baseApi = 'https://api.weixin.qq.com/cgi-bin/component'

Object.assign(exports, require('./baseApi')(moduleName, baseApi))