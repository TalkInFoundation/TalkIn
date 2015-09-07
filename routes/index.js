var express = require('express');
var checkAuth = require('../middleware/checkAuth');
var router = express.Router();

/* GET home page. */
router.get('/', checkAuth, function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
