var async = require('async');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var config = require('../config');
var HttpError = require('../errors/HttpError').HttpError;
var User = require('../models/users').User;
var History = require('../models/history').History;
var Conference = require('../models/room').Conference;
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
    var confio = io.of('/conferences');
    //var io = server;
    confio.use(function(socket, next){
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
    confio.on('connection', function(socket){
        if(socket.request.user){
            var slug = socket.request._query['slug'];
            var username = socket.request.user.get('username');
            Conference.findOne({slug: slug}, function(err, data){
                if(err) return new HttpError(404);
                if(!data) return new HttpError("Conference error!");
                if(!data.inConference(username)){
                    data.addUser(username);
                    data.save(function(err){
                       if(err) throw new HttpError(404);
                    });
                }
            });
            var users = findClientsSocketByRoomId(slug);

            function findClientsSocketByRoomId(roomId) {
                var res = {}
                    , room = confio.adapter.rooms[roomId];
                if (room) {
                    for (var id in room) {
                        res[confio.adapter.nsp.connected[id].client.request.user.username] = id;
                    }
                }
                return res;
            }

            socket.join(slug);

            socket.broadcast.to(slug).emit('clients:join', username);
            var userinfo = {
                username: username,
                user: users
                //...
            };
            socket.emit('clients:get:information', userinfo);

            //var users_online = _.filter(_.keys(profile), function(user){return username != user});
            socket.emit('clients:get:online', _.keys(users));



            History.find({conference: slug}).sort({created:-1}).limit(15).exec(function(err, data){
                if(err) return next(err);
                if(data.length > 0){
                    socket.emit('clients:get:history', data);
                }
            });



            socket.on('chat:send_message', function(data){
                var history = new History({
                    username: username,
                    message: data.message,
                    conference: slug,
                    images: data.images
                });

                history.save(function(err){
                    if(err){  return new HttpError("404")};
                });
                var _msg = {
                    message: data.message,
                    images: data.images,
                    _id: history._id,
                    time: history.created,
                    username: username
                };
                confio.to(slug).emit('chat:send_message', _msg);

            });

            socket.on('chat:edit_message', function(id, msg){
                History.findOneAndUpdate({_id: id}, {message: msg}, function(err, data){
                    if(err) next(err);
                    confio.to(slug).emit('chat:edit_message', msg, id);
                });
            });
            //socket.on('clients:get:online', function(){
            //    var users_online = _.filter(_.keys(profile), function(user){return username != user});
            //    socket.emit('clients:get:online', users_online);
            //});




            socket.on('chat:send_message:private', function(data){
                var _users = findClientsSocketByRoomId(slug);
                var _msg = {
                    message: data.msg,
                    username: username,
                    images: data.images,
                    time: data.time
                };
                confio.connected[_users[data.to]].emit('chat:send_message:private', _msg);
            });

            socket.on('disconnect', function(){
                socket.to(slug).broadcast.emit('clients:leave', username);
                delete users[username];
            })
        }else{
            socket.emit('not logged in');
            socket.disconnect();
        }


    });
    return io;
};