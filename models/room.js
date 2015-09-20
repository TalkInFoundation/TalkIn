var async = require('async');
var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;

var schema = new Schema({
    users: [{type: Schema.Types.ObjectId, ref: 'User'}],
    name: {type: String, required: true},
    history: {type: Schema.Types.ObjectId, ref: 'History'},
    owner: {type: Schema.Types.ObjectId, ref: 'User'},
    slug: {type: String, required: true}
});

schema.methods.getCountOfUsers = function(){
    return this.users.length;
};



schema.methods.addUser = function(user){
    this.users.push(user._id);
};

schema.virtual('own')
    .set(function(user){
        this.owner = user._id;
    })
    .get(function(){
        return this.owner;
    });

exports.Conference = mongoose.model('Conference', schema);