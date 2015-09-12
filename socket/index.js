var async = require('async');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var config = require('../config');
var HttpError = require('../errors/HttpError').HttpError;
var User = require('../models/users').User;
var History = require('../models/history').History;
var _ = require('underscore');
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
    if(session == null){
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
            socket.broadcast.emit('clients:join', username);

            var userinfo = {
                username: username
                //...
            };
            socket.emit('clients:get:information', userinfo);

            var users_online = _.filter(_.keys(users), function(user){return username != user});
            socket.emit('clients:get:online', users_online);



            History.find({}).sort({created:'asc'}).exec(function(err, data){
                if(err) return next(err);

                if(data.length > 0){

                    socket.emit('clients:get:history', data);
                }
            });

            socket.on('chat:send_message', function(msg){
                var history = new History({
                    username: username,
                    message: msg
                });

                history.save(function(err){
                    if(err) return next(err);
                });
                var _msg = {
                    message: msg,
                    _id: history._id,
                    username: username
                };

                io.emit('chat:send_message', _msg);

            });

            socket.on('chat:edit_message', function(id, msg){
                History.findOneAndUpdate({_id: id}, {message: msg}, function(err, data){
                    if(err) next(err);
                    socket.emit('chat:edit_message', msg, id);
                });
            });
            //socket.on('clients:get:online', function(){
            //    var users_online = _.filter(_.keys(users), function(user){return username != user});
            //    socket.emit('clients:get:online', users_online);
            //});




            socket.on('chat:send_message:private', function(data){
                var _msg = {
                    message: data.msg,
                    username: username
                };

                users[data.to].emit('chat:send_message:private', _msg);
            });

            socket.on('disconnect', function(){
                socket.broadcast.emit('clients:leave', username);
                delete users[username];
            })
        }else{
            socket.emit('not logged in');
        }


    });
    return io;
};