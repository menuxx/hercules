const {log, errorlog} = require('../logger')('rabbitmq')

module.exports = function delayer(channel, opts) {
	opts = opts || {}
	opts.separator = opts.separator || '.'
	opts.prefix = opts.prefix || 'delay'
	opts.threshold = opts.threshold || 10000
	opts.round = opts.round || 1000
	opts.publish = opts.publish || _publish

	function closeOnError(err) {
		if (!err) return false
		errorlog("[AMQP] error", err)
		channel.connection.close()
		return true
	}

	function promiseCallback(resolve, reject) {
		return function (err, ok) {
			if (closeOnError(err)) return
			if (ok) {
				resolve(ok)
			} else {
				reject(err)
			}
		}
	}

	function _publish(channel, name, routingKey, content, options) {
		return new Promise(function (resolve, reject) {
			channel.publish(name, routingKey, content, options, promiseCallback(resolve, reject))
		})
	}

	channel.delay = function (delayMs) {

		return {

			publish: function (exchange, routingKey, content, options) {

				delayMs = Math.ceil(delayMs / opts.round) * opts.round

				var ttl = delayMs
				var time = {ms: 1000, s: 60, m: 60, h: 24, d: 30, mo: 12, y: 999999}

				delayMs = Object.keys(time).map(function (unit) {
					var mod = delayMs % time[unit]
					delayMs = Math.floor(delayMs / time[unit])
					if (!mod) {
						return ''
					}
					return mod + unit
				}).reverse().join('')

				function _assertQueue(qName, exchange) {
					return new Promise(function (resolve, reject) {
						channel.assertQueue(qName, {
							durable: true,
							autoDelete: true,
							arguments: {
								'x-dead-letter-exchange': exchange,
								'x-message-ttl': ttl,
								'x-expires': ttl + opts.threshold
							}
						}, promiseCallback(resolve, reject))
					})
				}

				function _assertExchange(qName) {
					return new Promise(function (resolve, reject) {
						channel.assertExchange(qName, 'fanout', {
							durable: true,
							autoDelete: true
						}, promiseCallback(resolve, reject))
					})
				}

				function _bindQueue(qName) {
					return new Promise(function (resolve, reject) {
						channel.bindQueue(qName, qName, '#', {
							'x-dead-letter-exchange': exchange,
							'x-message-ttl': ttl,
							'x-expires': ttl + opts.threshold
						}, promiseCallback(resolve, reject))
					})
				}

				var name = [opts.prefix, exchange, delayMs].join(opts.separator)

				return _assertExchange(name)
					.then(function () {
						return _assertQueue(name, exchange)
					})
					.then(function () {
						return _bindQueue(name)
					})
					.then(function () {
						return opts.publish(channel, name, routingKey, content, options)
					})

			}
		}
	}
}
