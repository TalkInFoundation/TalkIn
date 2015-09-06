var express = require('express');
var User = require('../../models/users').User;
var async = require('async');

exports.get = function(req, res, next) {
    res.render('registration');
};

exports.post = function(req, res, next){
    var nickname = req.body.nickname;
    var password = req.body.password;
    var repeat_password = req.body.password_repeat;
    var email = req.body.email;

    User.createUser(nickname,  password, repeat_password, email, function(err, user){
        if(err){
            return next(err);
        }
        req.session.user = user._id;
        res.send("index");
        res.end();
    });

};