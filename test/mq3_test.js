const amqp = require('amqplib')
const {rabbit} = require('../config')

var channel = null;

amqp.connect(rabbit.uri).then(function (conn) {
  process.once('SIGINT', function () {
    conn.close()
    process.exit(1)
  });
  return conn.createChannel()
  .then(function (ch) {
    channel = ch;
  })
}).then(null, console.warn);

setInterval(function () {
  var timestamp = Date.now();
  console.log('publish mq3. ' + timestamp);
  var content = new Buffer(JSON.stringify({ timestamp, type: 'authorized', code: 'h7d21u8c7098djc87w0', appid: 'fd0nctvd44ncv5432n3d' }));
  channel.publish('test2', '_test_queue_04', content);
  // process.exit(0)
}, 2000)