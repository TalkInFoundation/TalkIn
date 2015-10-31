/**
 * Created by saucebwz on 30.10.2015.
 */
var mongoose = require('../libs/mongoose').db,
    findOrCreate = require('../db/db.queries').findOrCreate;

    Schema = mongoose.Schema;


var schema = new Schema({
    username: {
        type: String
    },
    conferences: [{
        type: String,
        default: []
    }]
});
schema.plugin(findOrCreate);

schema.statics.addConference = function(username, conference, callback){
    this.findOrCreate({username:username}, function(err, data){
        if(err) return new Error(err);
        data.conferences.push(conference);
        data.save();
        callback();
    });
};

exports.Contacts = mongoose.model('Contacts', schema);