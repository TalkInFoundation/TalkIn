var express = require('express');
var checkAuth = require('../../middleware/checkAuth');
var Conference = require('../../models/room').Conference;
var HttpError = require('../../errors/HttpError').HttpError;
var router = express.Router();


router.get('/conference/:slug', function(req, res, next) {
    var slug = req.params.slug;
    Conference.find({slug: slug}, function (err, data) {
        if (err) return next(err);
        if (!data.length > 0) return next(new HttpError(404, "No conference found!"));
        res.render('room', {title: 'TalkIn', slug: slug});
    });
});

module.exports = router;



