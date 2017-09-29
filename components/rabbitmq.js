// http://www.squaremobius.net/amqp.node/channel_api.html
const {log, errorlog} = require('../logger')('rabbitmq');
const amqp = require('amqplib/callback_api');
const {isArray} = require('lodash')
const {rabbit} = require('../config');

module.exports = function rabbitFactory() {

	var amqpConn = null;

	var offlinePubQueue = [];

	const start = function (callback) {
		callback = callback || function noop () {}
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
	});

	function closeOnErr(err) {
		if (!err) return false
		errorlog("[AMQP] error", err);
		if (amqpConn) amqpConn.close();
		return true;
	}

	/**
	 * `createConfirmChannel` opens a channel which uses "confirmation mode".
	 * A channel in confirmation mode require each published message to be 'acked' or 'nacked' by the server,
	 * thereby indicating that it has been handled.
	 *
	 * `offlinePubQueue` is an internal queue for messages that could not be sent when the application was offline.
	 * The application will check this queue and send the messages in the queue if a message is added to the queue.
	 */
	function startPublisher(conn, { exchangeName, exchangeType, opts }, callback) {
		conn.createConfirmChannel(function (err, ch) {
			if (closeOnErr(err)) return;
			ch.on('error', function (err) {
				errorlog('[AMQP] channel error %s', err.message);
			});
			ch.on('close', function () {
				log('[AMQP] channel closed');
			});
			ch.assertExchange(exchangeName, exchangeType, opts, function (err, _ok) {
				if (closeOnErr(err)) return;
				callback(ch);
			});
		});
	}

	function bindQueue(ch, queueName, exchange, routingKey) {
		return new Promise(function (resolve, reject) {
			ch.bindQueue(queueName, exchange, routingKey, {}, function (err, _ok) {
				if (closeOnErr(err)) {
					return reject(err)
				} else {
					log('%s bind queue : %s', exchange, queueName, _ok)
					return resolve(_ok)
				}
			})
		})
	}

	// A worker that acks messages only if processed successfully
	function startWorker(conn, {exchangeNames = [], queueName, routingKey, prefetch = 10}, workCallback) {
		conn.createChannel(function (err, ch) {
			if (closeOnErr(err)) return;
			ch.on('error', function (err) {
				errorlog('[AMQP] channel error %s', err.message);
			})
			ch.on('close', function () {
				log('[AMQP] channel closed');
			});
			ch.prefetch(prefetch);
			ch.assertQueue(queueName, {durable: true}, function (err, _ok) {
				if (closeOnErr(err)) return;
				Promise.all(exchangeNames.map(exchange => bindQueue(ch, queueName, exchange, routingKey))).then(function (oks) {
					ch.consume(queueName, processMsg, {noAck: false});
					log('[AMQP] queue %s Worker is started', queueName);
				}, function (errs) {
					console.log(errs)
					errs.forEach(closeOnErr)
				})
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

	return {

		start: start,

		/**
		 * The publish function will publish a message to an exchange with a given routing key.
		 * If an error occurs the message will be added to the internal queue, offlinePubQueue
		 * {persistent: true}
		 * delay {headers: {"x-delay": delay}
		 */
		publish: function publish(channel, exchangeName, routingKey, content, opts) {
			log('publish msg exchange: %s, routingKey: %s opts: %s', exchangeName, routingKey, JSON.stringify(opts));
			return new Promise(function (resolve, reject) {
				try {
					channel.publish(exchangeName, routingKey, content, opts, function (err) {
						if (err) {
							reject(err);
							errorlog('[AMQP publish]', err);
							offlinePubQueue.push([exchangeName, routingKey, content]);
							channel.connection.close();
						} else {
							resolve(true);
						}
					})
				} catch (e) {
					errorlog('[AMQP publish] %s', e.message);
					offlinePubQueue.push([exchangeName, routingKey, content]);
					reject(e);
				}
			});
		},
		publishObject: function (channel, exchangeName, routingKey, content, opts) {
			let msg = new Buffer(JSON.stringify(content));
			return this.publish(channel, exchangeName, routingKey, msg, opts);
		},
		// 创建普通 publisher
		createPublisher: function (exchangeName, callback) {
			var self = this
			function attach(ch) {
				while (true) {
					let m = offlinePubQueue.shift();
					if (!m) break;
					self.publish(ch, m[0], m[1], m[2]);
				}
				callback(ch);
			}

			var opts = { exchangeName, exchangeType: 'fanout' }

			if (amqpConn) {
				startPublisher(amqpConn, opts, attach);
			}
		},
		// 创建延迟 publisher
		createDelayPublisher: function (exchangeName, callback) {
			var self = this
			function attachDelay(ch) {
				while (true) {
					var m = offlinePubQueue.shift();
					if (!m) break;
					self.publish(ch, m[0], m[1], m[2]);
				}
				callback(ch);
			}

			var opts = {
				exchangeName,
				exchangeType: 'x-delayed-message',
				opts: {
					autoDelete: false, durable: true, passive: true,  arguments: {'x-delayed-type':  "direct"}
				}
			}

			if (amqpConn) {
				startPublisher(amqpConn, opts, attachDelay);
			}
		},
		// 创建 worker
		// { queueName, routingKey, prefetch=10 }
		// createWorker({}, function (data, channel, cb) {
		//
		// });
		createSimpleWorker: function (opts, callback) {
			start(function (err, conn) {
				if (closeOnErr(err)) {
					return;
				}
				startWorker(conn, opts, callback);
			});
		},
		publishDelay: function (channel, exchangeName, routingKey, content, delayS) {
			// channel, exchangeName, routingKey, content, opts
			return this.publishObject(channel, exchangeName, routingKey, content, {
				headers: { "x-delay": delayS * 1000 }
			})
		},
		publish2: function (channel, exchangeName, routingKey, content) {
			return this.publishObject(channel, exchangeName, routingKey, content, null)
		}
	}
}