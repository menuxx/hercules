const log = require('debug')('info:log')
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)
const hbs = require('./components/view')(app)
const {port} = require('./config').server

// handlers
const apihandler = require('./handler/apihandler')
const pageshandler = require('./handler/pageshandler')
const wxhandler = require('./handler/wxhandler')

app.use('/wx', wxhandler)

// https://github.com/expressjs/body-parser
const bodyparser = require('body-parser')
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: false }))

app.use(express.static(__dirname + '/public'))
app.use('/api', apihandler)
app.use('/', pageshandler)

require('./components/rabbitmq')

server.listen(port, function() {
  log(`server running on ${port}`)
})