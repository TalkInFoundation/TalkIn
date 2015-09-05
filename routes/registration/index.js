var express = require('express');
var User = require('../../models/users').User;
var async = require('async');

exports.registration = function(req, res, next) {
    res.render('registration');
};

exports.send_data = function(req, res, next){
    var nickname = req.body.nickname;
    var password = req.body.password;
    var repeat_password = req.body.password_repeat;
    var email = req.body.email;

    async.waterfall([
        function(callback){
            User.findOne({username: nickname}, callback);
        },

        function(user, callback){
            if(user){
                console.log(user);
                return next(new Error("Пользователь существует!"))
            }
            else{
                if(password !== repeat_password){
                    return next(new Error("Пароли не совпадают!"))
                }
                new User({
                    username: nickname,
                    password: password,
                    email: email})
                    .save(function(err){
                        if(err) return next(err);
                        callback(null, user);
                    })
            }
        },
        function(err, user){
            res.render('index');
            res.end();
        }
    ]);
};