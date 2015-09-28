var async = require('async');
var _ = require('underscore');
var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;

var _permissions = require('./permissions.json');

var schema = new Schema({
    users: [{type: String}],
    name: {type: String, required: true},
    history: {type: Schema.Types.ObjectId, ref: 'History'},
    owner: {type: String},
    slug: {type: String, required: true},
    permissions: {
        type: {}
    }
});

schema.methods.getCountOfUsers = function(){
    return this.users.length;
};

schema.statics.getAllPermissions = function(conferenceLevel){
    return {
        admin: _permissions.user_groups[conferenceLevel].admin.allowedActions,
        member: _permissions.user_groups[conferenceLevel].member.allowedActions,
        user: _permissions.user_groups[conferenceLevel].user.allowedActions
    }
};

schema.methods.isOwner = function(username){
    return username === this.owner;
};

schema.methods.hasPermission = function(action, typeOfUser){
    var permission = this.permissions[typeOfUser];
    console.log(permission);
    if(permission==="all"){
        return true;
    }
    var arr = permission.split(/(\s+)/);
    return _.contains(arr, action);
};

schema.methods.addUser = function(username){
    this.users.push(username);
};
schema.methods.userIn = function(username){
    return _.contains(this.users, username)
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