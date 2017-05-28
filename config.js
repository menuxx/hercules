
module.exports = {
  appId: process.env.WX_3RD_APP_ID || 'wxb3d033d520d15fe7', // component_appid
  appSecret: process.env.WX3RD__APP_SECRET || '99454ebe9eb76b704d9dfd8c34cc310b',  // component_appsecret
  appKey: process.env.WX_3RD_APP_KEY || 'gh_e9100e798b39',
  token: process.env.WX_3RD_APP_TOKEN || 'dg156c5719d3202f32a6619e14D0ccqd',
  encodingAESKey: process.env.WX_3RD_ENCODING_AES_KEY || 'kat52d5719d320nEj2A6l19u14H21ct2aI8K08rltKl',
  // 缓存发布通知地址
  cachePublishPointers: process.env.CACHE_PUBLISH_POINTERS.split(',') || [],
  rabbit: {
    uri: process.env.RABBIT_URI_01 || 'amqp://menuxx:28181820@wx3rd.menuxx.com:5692/menuxx'
  },
  auth: {
    'username': process.env.AUTH_USERNAME || 'menuxx3rd',
    'password': process.env.AUTH_PASSWORD || '28181820'
  },
  redis: {
    port: process.env.REDIS_01_PORT || 7389,
    host: process.env.REDIS_01_HOSTNAME || 'wx3rd.menuxx.com',
    password: process.env.REDIS_01_PASSWORD || '4cj34t4j9'
  },
  leancloud: {
    appId: process.env.LEANCLOUD_APPID || '98Yqw7EVpTpxvIP5wS4NK6j9-gzGzoHsz',
    appKey: process.env.LEANCLOUD_APPKEY || 'HqvqMuGWLEKQjc02Dwzmz142'
  }
}
// [
//     'http://api.menuxx.com/wx/component_cache',
//     'http://dev.api.menuxx.com/wx/component_cache',
//     'http://127.0.0.1:8080/wx/component_cache'
//   ]