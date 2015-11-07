/**
 * Created by saucebwz on 30.10.2015.
 */
var mongoose = require('../libs/mongoose').db,
    findOrCreate = require('../db/db.queries').findOrCreate;
var Conference = require('./room').Conference;
var _ = require('underscore');
var logger = require('../logging/logger');
    Schema = mongoose.Schema;


var schema = new Schema({
    username: String,
    conferences: [{
        type: Schema.Types.ObjectId,
        ref: 'Conference'
    }],
    requests: {
        addFriend: [{
            username: String,
            conference: {
                type: Schema.Types.ObjectId,
                ref: 'Conference'
            }
        }],
        requestsToFriend: [{
            username: String,
            conference: {
                type: Schema.Types.ObjectId,
                ref: 'Conference'
            }
        }]
    }

});

schema.plugin(findOrCreate);

schema.statics.addConference = function(username, id, callback){
    this.findOrCreate({username:username}, function(err, data){
        if(err) return new Error(err);
        data.conferences.push({_id: id});
        data.save();
        if(typeof callback == "function")
            callback();
    });
};

schema.statics.addFriend = function(username, friendName){
    var self = this;
    this.findOrCreate({username: username}, function(err, data){
        if(err){
            return new Error(err);
        }
        var conference = new Conference({
            users: [username, friendName],
            isPrivate: true
        });
        conference.save();
        data.requests.addFriend.push({username: friendName, conference: conference._id});
        data.save();
        self.findOrCreate({username: friendName}, function(err, data){
            data.requests.requestsToFriend.push({username: username, conference: conference._id});
            data.save();
        });
    });
};

schema.statics.acceptRequest = function(username, friendName){
    var self = this;
    this.findOne({username:username}).populate('requests.requestsToFriend.conference').exec(function(err, data){
        if(err) throw new Error(err);
        if(data){
            var requestData = _.find(data.requests.requestsToFriend, function(req){
                return req.username === friendName;
            });
            var conference = requestData.conference;
            conference.name = friendName;
            conference.save(function(err){
                if(err) throw new Error(err);
                console.log(conference);
                self.addConference(username, conference._id);
            });
            var newData = _.filter(data.requests.requestsToFriend, function(req){
                return req.username != friendName;
            });
            data.requests.requestsToFriend = newData;
            data.save(function(err){
                if(err){ throw new Error(err); }
                self.findOne({username: friendName}, function(err, data){
                    if(err) throw new Error(err);
                    if(data){
                        conference.name = username;
                        conference.save(function(err){
                            if(err) throw new Error(err);
                            self.addConference(friendName, conference._id);
                        });
                        var newData = _.filter(data.requests.addFriend, function(req){
                            return req.username != username;
                        });
                        data.requests.addFriend = newData;
                        data.save();
                    }
                })
            });
        }
    });
};

exports.Contacts = mongoose.model('Contacts', schema);