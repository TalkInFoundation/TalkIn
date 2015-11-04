/**
 * Created by saucebwz on 30.10.2015.
 */
var mongoose = require('../libs/mongoose').db,
    findOrCreate = require('../db/db.queries').findOrCreate;
var Conference = require('./room').Conference;
var logger = require('../logging/logger');
    Schema = mongoose.Schema;


var schema = new Schema({
    username: String,
    conferences: [{
        name: String,
        id: {
            type: Schema.Types.ObjectId,
            ref: 'Conference'
        }
    }]
});

schema.plugin(findOrCreate);

schema.statics.addConference = function(username, conference, id, callback){
    console.log(username);
    this.findOrCreate({username:username}, function(err, data){
        if(err) return new Error(err);
        console.log(data);
        data.conferences.push({name: conference, _id: id});
        data.save();
        callback();
    });
};

exports.Contacts = mongoose.model('Contacts', schema);