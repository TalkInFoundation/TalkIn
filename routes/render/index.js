var User = require('../../models/users').User;
var express = require('express');
var router = express.Router();
var Conference = require('../../models/room').Conference;
var checkAuth = require('../../middleware/checkAuth');
var async = require('async');
var _ = require('underscore');
var logger = require('../../logging/logger');
var Contact = require('../../models/contacts').Contacts;

router.get('/renderwidget/:filename', function(req, res, next) {
    var filename = req.params.filename;
    var options = {};
    if(filename === 'chat'){
        options = {typeOfUser: req.query.typeOfUser};
    }
    if(filename === 'conferenceAdmin'){

        Conference.findOne({'_id': req.query.id}, function(err, data){
            if(err){
                logger.log("error", "DB error! %j", err);
                return next(err);
            }
            res.render('ui/widgets/conferenceAdmin.widget.jade', {control: data});
        });
        return false;
    }
    res.render('ui/widgets/' + filename + '.widget.jade', options);
});

router.post('/searchcontact', function(req, res, next){
    var contact = req.body.contact;
    async.parallel([
        function(callback){ // search in users db
            User.findOne({username: contact}, function(err, user){
                if(err){
                    return callback(err);
                }
                if(user){
                    callback(null, user);
                }
                else{
                    callback(null);
                }
            });
        },
        function(callback){ //search in conference database
            callback(null);
        }
    ], function(err, data){
        if(err){
            logger.log('error', 'Error in /searchcontact. %j');
            return next(err);
        }
        if(!data[0] && !data[1]){
            data = [];
        }
        res.json({status: "success", data: data});
    });
});

router.post('/addfriend', function(req, res, next){
    var contact = req.body.contact;
    Contact.addFriend(req.user.username, contact);
    res.json("ok")
});

router.post('/accept-request', function(req, res, next){
    var contact = req.body.contact;
    Contact.acceptRequest(req.user.username, contact);
});

module.exports = router;