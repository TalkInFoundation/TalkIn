var Conference = require('../../models/room').Conference;

exports.get = function(req, res, next) {
    res.render('index', {title: 'TalkIn'});
};


exports.post = function(req, res, nezt){
    var roomName = req.body.roomName;
    var conference = new Conference({name: roomName});
    conference.addUser(req.user);
    conference.own = req.user;
    conference.save(function(err){
        if(err) return next(err);
    });
    res.json({status: "ok"});
};