var express = require('express');
var checkAuth = require('../../middleware/checkAuth');


exports.get = function(io) {
    return function(req, res, next){
        res.render('room', {title: 'TalkIn'});
    }
};



