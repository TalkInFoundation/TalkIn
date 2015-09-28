var express = require('express');
var checkAuth = require('../../middleware/checkAuth');
var Conference = require('../../models/room').Conference;
var HttpError = require('../../errors/HttpError').HttpError;
var router = express.Router();


router.get('/conference/:slug', checkAuth, function(req, res, next) {
    var slug = req.params.slug;
    var username = req.user.username;
    var perm;
    Conference.findOne({slug: slug}, function (err, data) {
        if (err) return next(err);
        if (!data) return next(new HttpError(404, "No conference found!"));
        if(data.isOwner(username)){
            perm = "admin";
        }
        else if(!data.inConference(username)){
            if(!data.hasPermission('connect', perm || "user")){
                return next(new HttpError(403, "Permission error!"));
            }
            data.addUser(username);
            perm = 'member';
            data.save(function(err){
                if(err) throw new HttpError(404);
            });
        }
        else{
            perm = "member";
        }
        res.render('room', {title: 'TalkIn', slug: slug, typeOfUser: perm, permissionList: data.permissions});
    });
});

module.exports = router;



