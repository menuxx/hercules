// https://hub.docker.com/_/rabbitmq/ 服务器 docker 镜像

// https://github.com/squaremo/amqp.node
// http://www.squaremobius.net/amqp.node/
const amqp = require('amqplib')

// // require('amqp-delay.node')(channel);
// // https://github.com/ismriv/amqp-delay.node

// console.log('11111')

// amqp.connect('amqp://menuxx:28181820@qurenjia.com:5692/menuxx').then(function (conn) {
// // amqp.connect('amqp://menuxx:28181820@106.14.147.41:5672/menuxx').then(function (conn) {
//   console.log('success')
//   conn.createChannel();
// }, function(err) {
//  console.error('Connect failed: %s', err);
// }).then(null, function(err) {
//   console.error('Connect succeeded, but error thrown: %s', err);
// }).catch(console.warn);

const uri = 'amqp://menuxx:28181820@qurenjia.com:5692/menuxx'

// function handleMessage (msg) {
//   console.log(msg)
// }

var q = 'tasks';

var channel;

amqp.connect(uri).then(function(conn) {
  return conn.createChannel().then(function (ch) {
    channel = ch
  });
}).then(null, console.warn);

// RABBITMQ_DEFAULT_VHOST

setInterval(function() {
    require('amqp-delay.node')(channel)
    return channel.delay(3000).publish('', q, new Buffer('hello world'))
}, 2000)

 
var open = require('amqplib').connect(uri);

open.then(function(conn) {
  return conn.createChannel();
}).then(function(ch) {
  return ch.assertQueue(q).then(function(ok) {
    return ch.sendToQueue(q, new Buffer('123123213'));
  });
}).catch(console.warn);
 
// Consumer
open.then(function(conn) {
  return conn.createChannel();
}).then(function(ch) {
  return ch.assertQueue(q).then(function(ok) {
    return ch.consume(q, function(msg) {
      if (msg !== null) {
        console.log(msg.content.toString());
        ch.ack(msg);
      }
    });
  });
}).catch(console.warn);