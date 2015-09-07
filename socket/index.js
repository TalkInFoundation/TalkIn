var async = require('async');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var config = require('../config');
var HttpError = require('../errors/HttpError').HttpError;
var User = require('../models/users').User;

function LoadSession(sid, callback){
    sessionStore.load(sid, function(err, session){
        if(arguments.length == 0){
            return callback(null, null);
        }
        else{
            return callback(null, session);
        }
    });
}

function GetUser(session, callback){
    if(!session.user){
        return callback(null, null);
    }

    User.findById(session.user, function(err, user){
        if(err) return callback(err);

        if(!user){
            return callback(null, null);
        }
        callback(null, user);
    });
}
function auth(handshake, callback){
    async.waterfall([
        function(callback){
            handshake.cookies = cookie.parse(handshake.headers.cookie || ''); //take all cookies
            var sidCookie = handshake.cookies[config.get('session:key')]; // get session cookie
            var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));//
            LoadSession(sid, callback);
        },
        function(session, callback){
            if(!session){
                callback(new HttpError(401, 'No Session!'));
            }
            handshake.session = session;
            GetUser(session, callback);
        },
        function(user, callback){
            if(!user){
                callback(new HttpError(403, "Anonymous session detected!"));
            }
            handshake.user = user;
            callback(null);
        }
    ], function(err){
        if(!err){
            console.log("test");
            return callback(true);
        }
        if(err instanceof HttpError){
            return callback(false);
        }
        callback(err);
    });
}

module.exports = function(server){
    var io = require('socket.io').listen(server);

    io.use(function(socket, next){
        var handshake = socket.request;
        auth(handshake, function(accepted){
            if(accepted){
                next();
            }
            if(!accepted){
                next(new HttpError("Login failed"))
            }
            next(accepted); // fatal error!
        });
    });



    var users = {};
    io.sockets.on('connection', function(socket){
        if(socket.request.user){
            var username = socket.request.user.get('username');
            users[username] = socket;
            socket.broadcast.emit('join', username);
            socket.on('send message', function(msg){
                socket.broadcast.emit('send message', msg);
            });

            socket.on('disconnect', function(){
                socket.broadcast.emit('leave', username);
            })
        }else{
            socket.emit('not logged in');
        }


    });
    return io;
};