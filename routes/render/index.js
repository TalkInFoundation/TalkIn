var User = require('../../models/users').User;
var express = require('express');
var router = express.Router();
var checkAuth = require('../../middleware/checkAuth');

router.get('/renderwidget/:filename', function(req, res, next) {
    var filename = req.params.filename;
    var typeOfUser = req.query.typeOfUser;
    res.render('ui/widgets/' + filename + '.widget.jade', {typeOfUser: typeOfUser});
});

module.exports = router;