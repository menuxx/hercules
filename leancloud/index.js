const AV = require('leancloud-storage')
const {leancloud} = require('../config')

AV.init(leancloud)

// const TestObject = AV.Object.extend('TestObject')

// var testObject = new TestObject()

// testObject.set('component_appid', 'wxb3d033d520d15fe7')
// testObject.set('component_access_token', 'ghYypObo_1dg7ACRzlOMEx5gjR1pHPujT2JUgvmwNfkknFrQfHaOjf39ajhGYEd32DvlvGDBsmrw8i3OKINpRYCoEPvp39YD162koWUE9M1ylmIBo-04GMHWCGcYVvE6ZUNfABAQLE')

// testObject.save().then(function(object) {
//   // console.log('LeanCloud Rocks!', object)
// })

// AV.Query.doCloudQuery('insert into TodoFolder(name, priority) values("工作2", 13)').then(function (data) {
//   // data 中的 results 是本次查询返回的结果，AV.Object 实例列表
//   var results = data.results
//   console.log(results)
// }, function (error) {
//   //查询失败，查看 error
//   console.error(error)
// });

// var query = new AV.Query('TestObject')

// // query.find().then(function(res) {
// //   console.log(res)
// // })

// // query.get('5929341fa0bb9f0057e3ba10').then(function (todo) {
// //   console.log('success', todo)
// // }, function (error) {
// //   console.log('error', error)
// // })

// query.equalTo('words', 'Hello World!')
// query.find().then(function (res) {
//   console.log(res)
// })


const WXEventLog = AV.Object.extend('EventLog')

export const saveEventLog = function (info) {
  var log = new WXEventLog()
  return log.save(info)
}

