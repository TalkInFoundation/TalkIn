var express = require('express');
var checkAuth = require('../../middleware/checkAuth');


exports.get = function(io) {
    return function(req, res, next){
        var slug = req.params.slug;
        res.render('room', {title: 'TalkIn', slug: slug});
    }
};



