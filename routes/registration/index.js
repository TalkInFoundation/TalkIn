var express = require('express');
var User = require('../../models/users').User;
var async = require('async');
var mongoose = require('../../libs/mongoose').db;
var _ = require('underscore');
var router = express.Router();


router.get('/registration', function(req, res, next) {
    res.render('registration');
});

router.post('/registration', function(req, res, next){
    var nickname = req.body.nickname;
    var password = req.body.password;
    var repeat_password = req.body.password_repeat;
    var email = req.body.email;

    User.createUser(nickname,  password, repeat_password, email, function(err, user){
        if(err){
            return next(err);
        }
        User.login(nickname, password, function(err, user){
            if(err) return next(err);
            req.session.user = user._id;
            res.redirect("/");
            res.end();
        });
    });

});

module.exports = router;