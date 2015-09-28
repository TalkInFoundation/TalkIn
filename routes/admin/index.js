var express = require('express');
var User = require('../../models/users').User;
var async = require('async');
var router = express.Router();
var Conference = require('../../models/room').Conference;

router.post('/inviteuser', function(req, res, next){
    var slug = req.body.roomSlug;
    var userToInvite= req.body.inviteUsername;
    var username = req.user.username;
    Conference.findOne({slug: slug}, function(err, conference){
        if(err) return next(new Error("Database error!"));
        if(!conference) return next(new Error(404, "No conference found!"));
        if(!conference.isOwner(username)) return next(new Error(403, "No permissions!"));
        User.findOne({username: userToInvite}, function(err, user){
            if(err) return next(new Error("Database error!"));
            if(!user){
                res.json({error: "No User Found!"});
                return false;
            }
            if(conference.userIn(userToInvite)){
                res.json({error: "User already in conference!"});
                return false;
            }
            conference.addUser(user.username);
            conference.save(function(err){
                if(err) return next(err);
            });
            res.json("ok");
        });
    });
});

module.exports = router;
