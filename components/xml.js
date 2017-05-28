// https://github.com/Leonidas-from-XIV/node-xml2js
const {Parser} = require('xml2js')
// https://www.npmjs.com/package/express-xml-bodyparser
const parser = require('express-xml-bodyparser')

var xmlParserDefaultConfig = {
  trim: false, explicitArray: false
}

export const xmlbodyparser = parser(xmlParserDefaultConfig)

export const xmlparser = new Parser(xmlParserDefaultConfig)