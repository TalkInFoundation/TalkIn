var async = require('async');
var cookie = require('cookie');
var cookieParser = require('cookie-parser');
var sessionStore = require('../libs/sessionStore');
var config = require('../config');
var HttpError = require('../errors/HttpError').HttpError;
var User = require('../models/users').User;
var History = require('../models/history').History;
var Conference = require('../models/room').Conference;
var Contacts = require('../models/contacts').Contacts;

var logger = require('../logging/logger')(module);
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

    var USER_STATUS = {
        OFFLINE: "Offline",
        ONLINE: "Online"
    };

    function getOnlineInConference(conference, usersOnline, username){
        var usersData = {};
        conference.users.forEach(function(user){
            usersData[user] = user in usersOnline ? USER_STATUS.ONLINE : USER_STATUS.OFFLINE;
        });
        usersData[username] = username in usersOnline ? USER_STATUS.ONLINE : USER_STATUS.OFFLINE;
        return usersData;
    }

    function setStructureOfMessage(username, message, images, time, type, id){
        return {
            message: message,
            images: images,
            _id: id,
            time: time,
            username: username,
            type: type
        }
    }


    var conference;
    confio.on('connection', function(socket){
        if(socket.request.user){
            logger.log('info', "New connection. IP: %s, username: ", socket.request.connection.remoteAddress, socket.request.user.get('username'))
            var slug = socket.request._query['slug'];
            var globalChannel = 'globalChannel';
            var typeOfUser = socket.request._query['typeOfUser'];
            var username = socket.request.user.get('username');
            var users = findClientsSocketByRoomId(slug);//online users
            var socketid = socket.id;


            if(_.contains(_.keys(users), username)){
                 return false; //needs notification to user
            }

            function init(){
                socket.join(globalChannel);
                Contacts.findOne({username:username}, function(err, contacts){
                    if(err){
                        logger.log('error', 'DB error in contacts search');
                        return new Error(err);
                    }
                    if(!contacts) {
                        return false;
                    }
                    var data = {
                        contacts: contacts,
                        username: username
                    };
                    socket.emit('init', data);
                });
            }

            init();

            socket.on('clients:join', function(id){
                socket.join(id);
                var users = findClientsSocketByRoomId(id);
                async.parallel([
                    function(callback){
                        Conference.findOne({'_id': id}, function(err, data){
                            if(err) return callback(err, data);
                            var clientInformation = {
                                users: users,
                                conferenceUsers: data.users, //get all users from conference
                                data: data
                            };
                            callback(null, clientInformation);
                        });
                    }
                ], function(err, results){
                    if(err){logger.log('error', 'Failed to get or create information about user and contacts. %j', results);}
                    socket.emit('clients:get:information', results[0], id);
                    var users = findClientsSocketByRoomId(id); //get latest information about connected users
                    confio.to(id).emit('clients:get:online', getOnlineInConference(results[0].data, users));
                });
            });


            //async.parallel([
            //    function(callback){
            //        Conference.findOne({slug: slug}, function(err, data){
            //            if(err) return callback(err, data);
            //            conference = data;
            //            var clientInformation = {
            //                username: username,
            //                user: users,
            //                conferenceUsers: conference.users //get all users from conference
            //            };
            //            callback(null, clientInformation);
            //        });
            //    },
            //    function(callback){
            //        Contacts.findOne({username:username}, function(err, data){
            //            if(err) return callback(err, data);
            //            if(!data) return callback(null, null);
            //            callback(null, data.conferences);
            //        });
            //    }
            //], function(err, results){
            //    if(err){logger.log('error', 'Failed to get or create information about user and contacts. %j', results);}
            //    socket.emit('clients:get:information', results[0], results[1]);
            //    users = findClientsSocketByRoomId(slug); //get latest information about connected users
            //    confio.to(slug).emit('clients:get:online', getOnlineInConference(conference, users));
            //});

            //Conference.findOne({slug: slug}, function(err, data){
            //    if(err) return new HttpError(404);
            //    conference = data;
            //    var clientInformation = {
            //        username: username,
            //        user: users,
            //        conferenceUsers: conference.users //get all users from conference
            //    };
            //    socket.emit('clients:get:information', clientInformation);
            //    users = findClientsSocketByRoomId(slug); //get latest information about connected users
            //    confio.to(slug).emit('clients:get:online', getOnlineInConference(conference, users, username));
            //});






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





            socket.broadcast.to(slug).emit('clients:join', username);



            socket.on('clients:typing', function(data){
                socket.broadcast.to(slug).emit('clients:typing', data);
            });

            socket.on('clients:get:history', function(id){
                History.find({conference: id}).sort({created:-1}).limit(15).exec(function(err, data){
                    if(err){
                        logger.log('error', 'Failed to get conference\'s history. Error: %j', err);
                    }
                    if(data.length > 0){
                        socket.emit('clients:get:history', data, id);
                    }
                });
            });


            socket.on("db:reload", function(){
                Conference.findOne({slug: slug}, function(err, data){
                    if(err){
                        logger.log('error', 'Failed to reload conference\'s data. Error: %j', err);
                    }
                    conference = data;
                });
            });

            socket.on('clients:joinToRoom', function(id){
                Conference.findOne({'_id': id}, function(err, data){
                    if(err){
                        logger.log('error', 'DB error in clients:joinToRoom. %j', err);
                        return new HttpError(500, "DB ERROR");
                    }
                    data.addUser(username);
                    data.save(function(err){
                        if(err){
                            logger.log('error', 'Failed to save conference . Error: %j', err);
                            socket.emit('client:info', 'db error', 'error');
                            return new HttpError(500);
                        }
                        typeOfUser = "member";
                        Contacts.addConference(username, data.name, data._id, function(){
                            socket.emit('clients:joinToRoom', slug);
                        })
                    })
                });

                //Contacts.findOrCreate({username: username}, function(err, contact){
                //    if(err) socket.emit('client:info', 'DB ERROR!', 'error');
                //    contact.conferences.push(slug);
                //    contact.save(function(err){
                //        if(err) socket.emit('client:info', 'DB ERROR!', 'error');
                //        socket.emit('clients:joinToRoom', slug);
                //    });
                //});
            });

            socket.on('chat:send_message', function(data){
                //if(!conference.hasPermission('write', typeOfUser)){
                //    socket.emit("client:info", "You have no permissions to chat!");
                //    return false;
                //}
                var history = new History({
                    username: username,
                    message: data.message,
                    conference: data.id,
                    images: data.images
                });

                history.save(function(err){
                    if(err){
                        logger.log('error', 'Failed to save history in chat:send_message. Error: %j', err);
                    }
                });
                var _msg = setStructureOfMessage(username, data.message, data.images, history.created, "public", history._id);
                confio.to(data.id).emit('chat:send_message', _msg, data.id);

            });

            socket.on('chat:edit_message', function(id, msg){
                History.findOneAndUpdate({_id: id}, {message: msg}, function(err, data){
                    if(err){
                        logger.log('error', 'Failed to update message. Error: %j', err);
                    }
                    confio.to(slug).emit('chat:edit_message', msg, id);
                });
            });
            //socket.on('clients:get:online', function(){
            //    var users_online = _.filter(_.keys(profile), function(user){return username != user});
            //    socket.emit('clients:get:online', users_online);
            //});




            socket.on('chat:send_message:private', function(data){//(username, message, images, time, type, id)
                if(!conference.hasPermission('write', typeOfUser)){
                    socket.emit("client:info", "You have no permissions to chat!", "error");
                    return false;
                }
                var _users = findClientsSocketByRoomId(slug);
                var _msg = setStructureOfMessage(username, data.message, data.images, data.time, "private");
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