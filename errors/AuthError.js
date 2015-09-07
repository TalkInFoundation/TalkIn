var path = require('path');
var util = require('util');
var http = require('http');

function AuthError(message){
    Error.apply(this, arguments);

    this.message = message || "Auth Error!";
}

util.inherits(AuthError, Error);

AuthError.prototype.name = "AuthError";

exports.AuthError = AuthError;

