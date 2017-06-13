const amqp = require('amqplib')
const {rabbit} = require('../config')

var channel = null

amqp.connect(rabbit.uri).then(function (conn) {
  process.once('SIGINT', conn.close.bind(conn));
  var ok = conn.createConfirmChannel()
  ok = ok.then(function (ch) {
    channel = ch;
    return Promise.all([
      ch.assertQueue('_test_queue_04', { durable: true, noAck: false }),
      ch.assertExchange('test2'),
      ch.bindQueue('_test_queue_04', 'test2', 'baz'),
      ch.consume('_test_queue_04', handleMessage, { noAck: false })
    ])
  })
  return ok;
}).then(null, console.warn);

function handleMessage(msg) {
  console.log('mq04 : ', msg.content.toString());
  channel.ack(msg);
}