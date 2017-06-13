const path = require('path')
// https://github.com/expressjs/session
const session = require('express-session')
// https://github.com/tj/connect-redis
const RedisStore = require('connect-redis')(session)
// https://github.com/valery-barysok/session-file-store
const FileStore = require('session-file-store')(session)
// session db index
const credis = require('./redis')({dbIndex: 3})
const {isProd} = require('../env')

var store;

if (!isProd()) {
	store = new FileStore({
		path: path.resolve(path.join(__dirname, '../tmp/sessions'))
	})
}

if (isProd()) {
  store = new RedisStore({ client: credis })
}

module.exports = session({
  store: store,
  secret: '1hJ9z1f02',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // not https
})