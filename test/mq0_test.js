const amqp = require('amqplib')
const {rabbit} = require('../config')

var channel = null

amqp.connect(rabbit.uri).then(function (conn) {
  process.once('SIGINT', conn.close.bind(conn));
  var ok = conn.createConfirmChannel()
  ok = ok.then(function (ch) {
    channel = ch;
    return Promise.all([
      ch.assertQueue('_test_queue_00', { durable: true }),
      ch.assertExchange('_excg1', 'topic'),
      ch.unbindQueue('_test_queue_00', '_excg1', 'wx.authorized'),
      ch.bindQueue('_test_queue_00', '_excg1', 'wx.authorized'),
      ch.consume('_test_queue_00', handleMessage, { noAck: false })
    ])
  })
  return ok;
}).then(null, console.warn);

function handleMessage(msg) {
  console.log('mq0 : ', msg.content.toString());
  channel.ack(msg);
}