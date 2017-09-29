require("babel-register");

const {log, errorlog} = require('./logger')('app')

// https://github.com/expressjs/morgan
const morgan = require('morgan')

const express = require('express')

const timeout = require('connect-timeout')
const app = express()
// https://github.com/expressjs/body-parser
const bodyparser = require('body-parser')
const cookieParser = require('cookie-parser')
// https://github.com/ctavan/express-validator
const expressValidator = require('express-validator')
const fundebug = require('./fundebug')
const http = require('http')
const server = http.createServer(app)
const hbs = require('./components/view')(app)
const {port} = require('./config').server

app.use(expressValidator())
app.use(timeout('5s'))

// handlers
const apihandler = require('./handler/apihandler')
const pageshandler = require('./handler/pageshandler')
const wxhandler = require('./handler/wxhandler')

app.use('/wx3rd', wxhandler)

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))


app.use(haltOnTimedout)
app.use(cookieParser())
app.use(haltOnTimedout)

app.use(fundebug.ExpressErrorHandler)

app.use(express.static(__dirname + '/public'))
app.use('/api', apihandler)
app.use('/', pageshandler)

require('./handler/others')(app)

app.use(morgan('combined'))

function haltOnTimedout (req, res, next) {
  if (!req.timedout) next()
}

// 初始化消息队列发布器
require('./components/webhook').start({ queue: 'app_webhooks' });

server.listen(port, function() {
  log(`server running on ${port}`)
})

