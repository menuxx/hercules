const amqp = require('amqplib/callback_api');
const {errorlog, log} = require('../logger')('webhook');
const request = require('requestretry');
const extend = require('util')._extend;
const {rabbit} = require('../config');

var amqpConn = null;

var webhooksChannel = null;

var offlinePubQueue = [];

var queueName = 'webhooks';

const opts = {
	maxAttempts: 2,
	retryDelay: 5000,
	retryStrategy: request.RetryStrategies.HTTPOrNetworkError
};

// { maxAttempts: 1, retryDelay: 3000, retryStrategy: 'HTTPError', url: 'http://xxx.xx', body: '\{\}' }
export const webNotify = function (url, body) {
	let payload = new Buffer(JSON.stringify({url, body}));
	return publish('', queueName, payload);
};

// ?heartbeat=60
export const start = function ({queue=queueName}) {
	queueName = queue + '_webhook_queue';
	amqp.connect(rabbit.uri + '?heartbeat=60', function (err, conn) {
		if (err) {
			errorlog('[AMQP connect %s]', err.message);
			// 重试一次
			return setTimeout(function () {
				start({queue});
			}, 1000);
		}
		conn.on('error', function (err) {
			if (err.message !== 'Connection closing') {
				errorlog('[AMQP] conn error %s', err.stack);
			}
		});
		conn.on('close', function (err) {
			errorlog("[AMQP] reconnecting %s", err.stack);
			setTimeout(function () {
				start({queue});
			}, 1000);
		});
		log("[AMQP] connected");
		amqpConn = conn;
		whenConnected();
	});
	return webNotify;
};

function closeOnErr(err) {
	if (!err) return false;
	errorlog("[AMQP] error", err);
	amqpConn.close();
	return true;
}

function whenConnected() {
	startWebhookWorker();
	startPublisher();
}

function startPublisher() {
	amqpConn.createConfirmChannel(function (err, ch) {
		if (closeOnErr(err)) return;
		ch.on('error', function (err) {
			errorlog('[AMQP] channel error %s', err.message);
		});
		ch.on('close', function () {
			log('[AMQP] channel closed');
		});
		// 添加 延迟 支持
		// 使用 错误 恢复 的 publish 方法
		webhooksChannel = ch;
		while (true) {
			var m = offlinePubQueue.shift();
			if (!m) break;
			publish(ch, m[0], m[1], m[2]);
		}
	})
}

/**
 * The publish function will publish a message to an exchange with a given routing key.
 * If an error occurs the message will be added to the internal queue, offlinePubQueue
 */
function publish(exchange, routingKey, content) {
	return new Promise(function (resolve, reject) {
		if (!webhooksChannel) {
			return reject(new Error('webhook channel not ready!'));
		}
		try {
			webhooksChannel.publish(exchange, routingKey, content, {persistent: true}, function (err, ok) {
				if (err) {
					reject(err);
					errorlog('[AMQP publish]', err);
					offlinePubQueue.push([exchange, routingKey, content]);
					webhooksChannel.connection.close();
				} else {
					resolve(ok);
				}
			})
		} catch (e) {
			errorlog('[AMQP publish] %s', e.message);
			offlinePubQueue.push([exchange, routingKey, content]);
			reject(e);
		}
	})
}

function startWebhookWorker() {

	amqpConn.createChannel(function (err, ch) {

		ch.assertQueue(queueName, {durable: true, noAck: false});

		log(" [*] Waiting for messages in %s", queueName);

		ch.consume(queueName, function (msg) {

			log(' [*] Received message %j', msg.content.toString());
			// Parse the message content as JSON
			try {
				var data = JSON.parse(msg.content.toString());
			} catch (e) {
				log(" [x] Failed: %s is not valid JSON.", msg.content.toString());
				ch.reject(msg, false);
				return;
			}

			// Stringify the body for use as the webhook request body
			var body = JSON.stringify(data.body);

			// Check for any retry options that may be set
			if (data.maxAttempts > 1) {
				opts.maxAttempts = data.maxAttempts;
			}
			if (data.retryDelay > 0) {
				opts.retryDelay = data.retryDelay;
			}
			if (data.retryStrategy == 'HTTPError') {
				opts.retryStrategy = request.RetryStrategies.HTTPError;
			}
			if (data.retryStrategy == 'NetworkError') {
				opts.retryStrategy = request.RetryStrategies.NetworkError;
			}

			var req = {
				uri: data.url,
				method: 'POST',
				body: body,
				headers: {
					'Content-Type': 'application/json'
				}
			};

			// Merge our request options with the request
			extend(req, opts);

			request(req, function (error, response, body) {
				if (!error) {
					log(" [*] Complete: %s", msg.content.toString());
					ch.ack(msg);
				} else {
					log(" [!] Incomplete: Delivery failed after " + opts.maxAttempts + " attempts. %j", msg.content.toString());
					ch.reject(msg, true);
				}
			});

		});

	});

}


