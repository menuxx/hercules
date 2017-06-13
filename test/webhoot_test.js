
var {webNotify} = require('../components/webhook')

setTimeout(function () {
  webNotify('http://127.0.0.1:8082/wx/3rd/notify', { aaa: 1234, bbb: 2345, abcd: 'hehe' }).then(function (){
    console.log('notify done')
  }, function (err) {
    console.error(err)
  })
}, 5000)