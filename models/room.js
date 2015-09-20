var async = require('async');
var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;

var schema = new Schema({
    users: [{type: String}],
    name: {type: String, required: true},
    history: {type: Schema.Types.ObjectId, ref: 'History'},
    owner: {type: String},
    slug: {type: String, required: true}
});

schema.methods.getCountOfUsers = function(){
    return this.users.length;
};



schema.methods.addUser = function(username){
    this.users.push(username);
};

schema.methods.inConference = function(username){
    return this.users.indexOf(username) !== -1;
};

schema.virtual('own')
    .set(function(user){
        this.owner = user._id;
    })
    .get(function(){
        return this.owner;
    });

exports.Conference = mongoose.model('Conference', schema);