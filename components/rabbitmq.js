// http://www.squaremobius.net/amqp.node/channel_api.html
const {log, errorlog} = require('../logger')('rabbitmq');
const amqp = require('amqplib/callback_api');
const {rabbit} = require('../config');

var amqpConn = null;

var offlinePubQueue = [];

const start = function (callback) {
	amqp.connect(rabbit.uri + '?heartbeat=60', function (err, conn) {
		if (err) {
			callback(err);
			errorlog('[AMQP connect %s]', err.message);
			// 重试一次
			return setTimeout(function () {
				start(callback);
			}, 1000);
		}
		conn.on('error', function (err) {
			if (err.message !== 'Connection closing') {
				callback(err);
				errorlog('[AMQP] conn error %s', err.message);
			}
		});
		conn.on('close', function (err) {
			errorlog("[AMQP] onconnecting", err);
			return setTimeout(function () {
				start(callback);
			}, 1000);
		});
		log("[AMQP] connected");
		amqpConn = conn;
		callback(null, amqpConn);
	});
};

// 当应用关闭之前， 断开连接，释放资源
process.on('exit', (code) => {
	log(`rabbotmq exit: ${code}`);
	if (amqpConn) amqpConn.close();
	if (appPublisherChannel) appPublisherChannel.connection.disconnect();
});

function closeOnErr(err) {
	if (!err) return false
	errorlog("[AMQP] error", err);
	if (amqpConn) amqpConn.close();
	if (appPublisherChannel) appPublisherChannel.close();
	return true;
}

/**
 * The publish function will publish a message to an exchange with a given routing key.
 * If an error occurs the message will be added to the internal queue, offlinePubQueue
 */
export const publish1 = function publish1(channel, exchange, routingKey, content, opts) {
	log('publish msg exchange: %s, routingKey: %s', exchange, routingKey);
	return new Promise(function (resolve, reject) {
		try {
			channel.publish(exchange, routingKey, content, Object.assign({persistent: true}, opts), function (err, ok) {
				if (err) {
					reject(err);
					errorlog('[AMQP publish]', err);
					offlinePubQueue.push([exchange, routingKey, content]);
					channel.connection.close();
				} else {
					resolve(ok);
				}
			})
		} catch (e) {
			errorlog('[AMQP publish] %s', e.message);
			offlinePubQueue.push([exchange, routingKey, content]);
			reject(e);
		}
	});
};

// 忽略
export const publishDelay = function (delayChannel, exchangeName, delayMs, routingKey, msg) {
	if (!delayChannel) {
		return Promise.reject(new Error('channel not ready !'))
	}
	return delayChannel.delay(delayMs).publish(exchangeName, routingKey, msg);
};

export const publish2 = function (channel, exchangeName, routingKey, content) {
	let msg = new Buffer(JSON.stringify(content));
	return publish1(channel, exchangeName, routingKey, msg);
};

const publishObject = function (channel, exchangeName, routingKey, msg, options) {
	let content = new Buffer(JSON.stringify(msg));
	return publish1(channel, exchangeName, routingKey, content, options);
};

// 创建普通 publisher
export const createPublisher = function (exchangeName, callback) {
	function attach(ch) {
		while (true) {
			let m = offlinePubQueue.shift();
			if (!m) break;
			publish1(ch, m[0], m[1], m[2]);
		}
		callback(ch);
	}

	if (!amqpConn) {
		start(function (err, conn) {
			if (closeOnErr(err)) {
				return;
			}
			startPublisher(conn, exchangeName, attach);
		});
	} else {
		startPublisher(amqpConn, exchangeName, attach);
	}
};

// 创建延迟 publisher
export const createDelayPublisher = function (exchangeName, callback) {
	function attachDelay(ch) {
		while (true) {
			var m = offlinePubQueue.shift();
			if (!m) break;
			publish1(ch, m[0], m[1], m[2]);
		}
		require('./rabbitmq_delay')(ch, {publish: publishObject});
		callback(ch);
	}

	if (!amqpConn) {
		start(function (err, conn) {
			if (closeOnErr(err)) {
				return;
			}
			startPublisher(conn, exchangeName, attachDelay);
		});
	} else {
		startPublisher(amqpConn, exchangeName, attachDelay);
	}
};

/**
 * `createConfirmChannel` opens a channel which uses "confirmation mode".
 * A channel in confirmation mode require each published message to be 'acked' or 'nacked' by the server,
 * thereby indicating that it has been handled.
 *
 * `offlinePubQueue` is an internal queue for messages that could not be sent when the application was offline.
 * The application will check this queue and send the messages in the queue if a message is added to the queue.
 */
function startPublisher(conn, exchangeName, callback) {
	conn.createConfirmChannel(function (err, ch) {
		if (closeOnErr(err)) return;
		ch.on('error', function (err) {
			errorlog('[AMQP] channel error %s', err.message);
		});
		ch.on('close', function () {
			log('[AMQP] channel closed');
		});
		ch.assertExchange(exchangeName, 'fanout', {}, function (err, _ok) {
			if (closeOnErr(err)) return;
			callback(ch);
		});
	});
}

// A worker that acks messages only if processed successfully
function startWorker(conn, {exchangeName, queueName, routingKey, prefetch = 10}, workCallback) {
	conn.createChannel(function (err, ch) {
		if (closeOnErr(err)) return;
		ch.on('error', function (err) {
			errorlog('[AMQP] channel error %s', err.message);
		})
		ch.on('close', function () {
			log('[AMQP] channel closed');
		});
		ch.prefetch(prefetch);
		ch.assertExchange(exchangeName, 'fanout', {}, function (err, _ok) {
			if (closeOnErr(err)) return;
			ch.assertQueue(queueName, {durable: true}, function (err, _ok) {
				if (closeOnErr(err)) return;
				ch.bindQueue(queueName, exchangeName, routingKey, {}, function (err, _ok) {
					if (closeOnErr(err)) return;
					ch.consume(queueName, processMsg, {noAck: false});
					log('[AMQP] queue %s Worker is started', queueName);
				});
			});
		});
		function processMsg(msg) {
			try {
				var data = JSON.parse(msg.content.toString());
			} catch (e) {
				ch.reject(msg, false);
			}
			let promise = workCallback(data, ch);
			if (!promise.then) {
					errorlog('startWorker workerCallback must be return Promise object');
			} else {
				promise.then(function success({ok, status = true}) {
					try {
						if (ok) {
							ch.ack(msg);
						} else {
							ch.reject(msg, status);
						}
					} catch (e) {
						closeOnErr(e);
					}
				}, function fail(e) {
					var {ok, status} = e
					if (!ok) {
						ch.reject(msg, status);
					} else {
						closeOnErr(e);
					}
				});
			}
		}
	})
}

// 创建 worker
// { queueName, routingKey, prefetch=10 }
// createWorker({}, function (data, channel, cb) {
// 
// });
export const createSimpleWorker = function (opts, callback) {
	start(function (err, conn) {
		if (closeOnErr(err)) {
			return;
		}
		opts = Object.assign(opts)
		startWorker(conn, opts, callback);
	});
};

export const createCustomWorker = function (opts, callback) {
	start(function (err, conn) {
		if (closeOnErr(err)) {
			return;
		}
		startWorker(conn, opts, callback);
	});
};

var appPublisherChannel = null;

export const appPublish = function (routingKey, content) {
	if (appPublisherChannel === null) {
		log('! appPublisherChannel is not ready ....')
	} else {
		return publish2(appPublisherChannel, "yth3rd", routingKey, content)
	}
};

export const appDelayPublish = function (delayMs, routingKey, content) {
	if (appPublisherChannel === null) {
		log('! appPublisherChannel is not ready ....')
	} else {
		return appPublisherChannel.delay(delayMs).publish("yth3rd", routingKey, content);
	}
};

// 初始化
export const appPublisher = function () {
	createDelayPublisher("yth3rd", function (ch) {
		appPublisherChannel = ch
	});
};