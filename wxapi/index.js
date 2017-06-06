var {assign} = require('lodash')
var component = require('./componentApi')
var message = require('./messageApi')

const InfoTypes = {
  UNAUTHORIZED: 'unauthorized',
  AUTHORIZED: 'authorized',
  UPDATEAUTHORIZED: 'updateauthorized',
  COMPONENT_VERIFY_TICKET: 'component_verify_ticket'
}

module.exports = assign({}, {InfoTypes}, component, message)