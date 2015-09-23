var express = require('express');
var User = require('../../models/users').User;
var async = require('async');
var router = express.Router();


router.get('/login', function(req, res, next){
    var err;
    if(req.session.isAuthError){
        err = "Вы не вошли на сайт!";
        req.session.isAuthError = null;
    }
    console.log("rendering");
    res.render('login', {error: err});
});

router.post('/login', function(req, res, next){
    var username = req.body.username;
    var password = req.body.password;
    User.login(username, password, function(err, user){
        if(err) return next(err);
        req.session.user = user._id;
        res.redirect("/");
        res.end();
    });
});
router.logout = function(req, res){
    req.session.destroy();
    res.redirect('/login');
};
module.exports = router;
