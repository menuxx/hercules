// 404

const {errorlog} = require('../logger')('othershander')

module.exports = function (app) {

  app.use(function(req, res, next) {
    res.status(404).render('404');
  });

  // 500
  app.use(function(err, req, res, next) {
    errorlog(err.stack);
    res.status(500).render('error');
  });
  
}