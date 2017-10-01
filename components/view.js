// https://github.com/pillarjs/hbs
// http://handlebarsjs.com/builtin_helpers.html
const hbs = require('hbs')
const path = require('path')
var helpers = require('handlebars-helpers')({
	handlebars: hbs
});
module.exports = function (app) {
	hbs.registerHelper('dateFormat', require('handlebars-dateformat'));
	hbs.registerHelper(helpers)
	hbs.registerPartials(path.resolve('views/partials'))
	app.engine('hbs', hbs.__express)
	app.set('views', path.resolve('views'))
	app.set('view cache', false)
	app.set('view engine', 'hbs')
	return hbs
}