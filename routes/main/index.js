var Conference = require('../../models/room').Conference;
var express = require('express');
var router = express.Router();




router.post('/', function(req, res, nezt){
    var roomName = req.body.roomName;
    var roomSlug = req.body.roomSlug;
    var conference = new Conference({name: roomName, slug: roomSlug});
    conference.addUser(req.user.username);
    conference.own = req.user;
    conference.save(function(err){
        if(err) return next(err);
    });
    res.json({status: "ok"});
});

router.get('/', function(req, res, next){
    Conference.find({}, function(err, conferences){
        if(err) return next(err);
        res.render('index', {title: 'TalkIn', conferences: conferences});
    });
});

module.exports = router;