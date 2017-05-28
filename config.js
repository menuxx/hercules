
module.exports = {
  appId: process.env.WX_3RD_APP_ID, // component_appid
  appSecret: process.env.WX_3RD_APP_SECRET,  // component_appsecret
  appKey: process.env.WX_3RD_APP_KEY,
  token: process.env.WX_3RD_APP_TOKEN,
  encodingAESKey: process.env.WX_3RD_ENCODING_AES_KEY,
  // 缓存发布通知地址
  cachePublishPointers: process.env.CACHE_PUBLISH_POINTERS.split(',') || [],
  rabbit: {
    uri: process.env.RABBIT_URI_01
  },
  auth: {
    'username': process.env.AUTH_USERNAME,
    'password': process.env.AUTH_PASSWORD
  },
  redis: {
    port: process.env.REDIS_01_PORT,
    host: process.env.REDIS_01_HOSTNAME,
    password: process.env.REDIS_01_PASSWORD
  },
  leancloud: {
    appId: process.env.LEANCLOUD_APPID,
    appKey: process.env.LEANCLOUD_APPKEY
  }
}
// [
//     'http://api.menuxx.com/wx/component_cache',
//     'http://dev.api.menuxx.com/wx/component_cache',
//     'http://127.0.0.1:8080/wx/component_cache'
//   ]