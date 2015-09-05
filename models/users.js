var crypto = require('crypto');

var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;

var schema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});
schema.methods.encryptPassword = function(password){
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

//schema.path('email').validate(function (email) {
//    var emailRegex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
//    return emailRegex.test(email.text);
//}, 'Вы ввели неправильную почту.');

schema.virtual('password')
    .set(function(password){
        this._plainPassword = password;
        this.salt = Math.random() + '';
        this.hashedPassword = this.encryptPassword(password);
    })
    .get(function(){
        return this._plainPassword;
    });

schema.methods.checkPassword = function(password){
    return this.encryptPassword(password) == this.hashedPassword;
};



exports.User = mongoose.model('User', schema);