var express = require('express');
var User = require('../../models/users').User;
var async = require('async');

exports.get = function(req, res, next) {
    res.render('login');
};

exports.post = function(req, res, next){
    var username = req.body.username;
    var password = req.body.password;
    User.login(username, password, function(err, user){
        if(err) return next(err);
        req.session.user = user._id;
        res.redirect("/");
        res.end();
    });
};
exports.logout = function(req, res){
    req.session.destroy();
    res.redirect('/');
};