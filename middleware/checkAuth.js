var AuthError = require('../errors/AuthError').AuthError;


module.exports = function(req, res, next){
    if(req.user){
        next();
    }
    else{
        next(new AuthError("You are not logged in!"))
    }
}