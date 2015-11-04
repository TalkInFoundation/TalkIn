var User = require('../../models/users').User;
var express = require('express');
var router = express.Router();
var Conference = require('../../models/room').Conference;
var checkAuth = require('../../middleware/checkAuth');
var _ = require('underscore');

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

module.exports = router;