
var {getAuthorizerList, getAuthorizerInfo, getAuthorizerAccessToken} = require('../wxlite')

var {authorizerApi} = require('../leancloud')

var offset = 40, count = 20

getAuthorizerList(offset, count).then( ( res ) => {
  res.list.forEach(function ({ authorizer_appid, refresh_token }) {
    Promise.all([
      getAuthorizerInfo(authorizer_appid),
      getAuthorizerAccessToken(authorizer_appid, refresh_token)
    ])
    .then(function (res) {
      var {authorizer_info} = res[0], {authorizer_access_token, authorizer_refresh_token} = res[1]
      authorizerApi.save({
          appId: authorizer_appid,
          logoUrl: authorizer_info.head_img,
          primaryName: authorizer_info.nick_name,
          businessName: authorizer_info.principal_name,
          qrcodeUrl: authorizer_info.qrcode_url,
          refreshToken: authorizer_refresh_token,
          authorized: true
      })
      .then(function (ok) {
        console.log(ok)
      }, function (err) {
        console.log(err)
      })
    })
  })
})