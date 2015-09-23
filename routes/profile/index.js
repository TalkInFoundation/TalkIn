var User = require('../../models/users').User;
var express = require('express');
var router = express.Router();


router.get('/users/:username', function(req, res, next) {
    var username = req.params.username;
    User.findOne({username: username}, function(err, user){
        if(err) return next("database error in getting user profile");
        console.log(user);
        res.render('profile', {user: user, title: "TalkIn"});
    });


});

module.exports = router;