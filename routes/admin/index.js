var express = require('express');
var User = require('../../models/users').User;
var async = require('async');
var router = express.Router();
var Conference = require('../../models/room').Conference;
var _ = require('underscore');
router.post('/inviteuser', function(req, res, next){
    var slug = req.body.roomSlug;
    var userToInvite= req.body.inviteUsername;
    var username = req.user.username;
    console.log("test");
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
            res.json({success: "User " + userToInvite + " has been invited!"});
        });
    });
});

router.post('/sendpermissions', function(req, res, next){
    var slug = req.body.roomSlug;
    var io = req.app.get('io');
    var username = req.user.username;
    var userPermissions = req.body.userPermissions;
    var memberPermissions = req.body.memberPermissions;
    Conference.findOne({slug: slug}, function(err, conference) {
        if (err) return next(new Error("Database error!"));
        if (!conference) return next(new Error(404, "No conference found!"));
        if (!conference.isOwner(username)) return next(new Error(403, "No permissions!"));
        var old_perms = _.clone(conference.permissions);
        old_perms.user = userPermissions;
        old_perms.member = memberPermissions;
        conference.permissions = old_perms;

        conference.save(function(err){
            if(err){
                return next(err);
            }
            res.json({success: "Permissions saved!"})
        });
    });
});
module.exports = router;
