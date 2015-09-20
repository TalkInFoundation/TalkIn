var Conference = require('../../models/room').Conference;



exports.get = function(req, res, next) {
    Conference.find({}, function(err, conferences){
        if(err) return next(err);
        res.render('index', {title: 'TalkIn', conferences: conferences});
    });
};


exports.post = function(req, res, nezt){
    var roomName = req.body.roomName;
    var roomSlug = req.body.roomSlug;
    var conference = new Conference({name: roomName, slug: roomSlug});
    conference.addUser(req.user);
    conference.own = req.user;
    conference.save(function(err){
        if(err) return next(err);
    });
    res.json({status: "ok"});
};