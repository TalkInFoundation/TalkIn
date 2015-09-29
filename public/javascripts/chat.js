var init = function(option) {
    $('.scrollbar-macosx').scrollbar();
    var $slug = $('.slug').attr('id');
    console.log($slug);
    var socket = io.connect('/conferences', {query: 'slug=' + $slug + "&" + "typeOfUser=" + typeOfUser});
    var $chat_text = $('#chat_text');
    var $messages = $('#msgs');
    var $imagePlaceholder = $('.image-placeholder');
    var _users = [];
    var userinfo = {};
    var imagesArray = [];

    /* GET profile online */
    /*  END  */

    /* GET user informatio */


    $chat_text.keyup(function () {
        var message = $chat_text.val();
        if (message.length > 5) {
            var imageRegex = /(https?:\/\/[^\s\n\t]*\.(?:png|jpg))/;
            var imageFound = message.match(imageRegex);
            if (imageFound) {
                if (imagesArray.indexOf(imageFound[0]) !== -1) return false;
                var newMessage = message.replace(imageRegex, '');
                $chat_text.val(newMessage);
                var div = $('<div />', {
                    class: 'chat-image-placeholder'
                });
                var p = $('<p />', {
                    class: 'chat-image-close'
                }).text("✖");
                var img = $('<img />', {
                    src: imageFound[0],
                    width: "70",
                    height: "70",
                    class: "chat-image"
                }).on('error', function () {
                    return false;
                }).on('load', function () {
                    div.append(p);
                    div.append(img);
                    $imagePlaceholder.append(div);
                    imagesArray.push(imageFound[0]);
                });

            }
        }
    });
    $chat_text.keypress(function (e) {
        var message = $chat_text.val();
        if (message.replace(/[\s\t\n]/g, '') == '' && !imagesArray.length > 0)
            return;
        if (e.which == 13 && !e.shiftKey) {
            if (message.length > 0 || imagesArray.length > 0) {
                if (message.length > 3) {
                    var whisper_regex = /^[\\\/]w\s([A-Za-z0-9_]+)\s(.*)/i;
                    var match = message.match(whisper_regex);
                    if (match) {//if username and msg provided
                        var to = match[1];
                        var msg = match[2];
                        if (to === userinfo.username) return false;// we don't need to send private messages to ourselves
                        if ($.inArray(to, _users) !== -1) {
                            socket.emit('chat:send_message:private', {
                                to: to,
                                msg: msg,
                                time: Date.now(),
                                images: imagesArray || []
                            });
                            var data = {
                                message: msg,
                                username: userinfo.username,
                                time: Date.now(),
                                images: imagesArray
                            };
                            sendPrivateMessage(data, true);
                            imagesArray = [];
                            $chat_text.val("");
                            return false;
                        }
                        else {
                            //...
                            return false;
                        }
                    }

                }
                socket.emit('chat:send_message', {message: message, images: imagesArray || []});
                imagesArray = [];
                $imagePlaceholder.empty();
                $chat_text.val("");
                //sendMessage(message, 'left', false);
                return false;
            }
        }
    });
    $('#logout').on('click', function () {
        $.post('/logout', function (data) {
            $('#logout').text("Вы вышли!");
        });
    });

    $('#send_invite').on('click', function() {
        var userToInvite = $('#inviteName').val();
        $.ajax({
            method: "POST",
            url: "/inviteuser",
            data: {roomSlug:$slug, inviteUsername: userToInvite}
        })
            .done(function (msg) {
                if(msg.error){
                    showInfo(msg.error, 'error');
                }
                if(msg.success){
                    showInfo(msg.success, 'success');
                }
            });
    });


    $('#send_permissions').on('click', function() {
        var $memberPermissions = $('#memberPermissions').val();
        var $userPermissions = $('#userPermissions').val();
        _.each([$memberPermissions, $userPermissions], function(perm){
            if(!perm.length > 0){
                perm = "restricted";
            }
        });
        $.ajax({
            method: "POST",
            url: "/sendpermissions",
            data: {roomSlug:$slug, userPermissions: $userPermissions, memberPermissions: $memberPermissions}
        })
            .done(function (msg) {
                if(msg.error){
                    showInfo(msg.error, 'error');
                }
                if(msg.success){
                    showInfo(msg.success, 'success');
                    socket.emit('db:reload');
                }
            });
    });



    $('#openPanel').on("click", function(){
        var self = $(this);
        var $panel = $('.admin-panel-wrapper');
        if(!$panel.hasClass('hidden')){
            $panel.addClass('hidden');
            self.val("Admin Panel");
        }
        else{
            $panel.removeClass('hidden');
            $(this).val("Hide");
        }

    });

    socket.on('chat:send_message', function (data) {
        sendCheck(data, false);
    });

    socket.on('chat:send_message:private', function (data) {
        sendCheck(data, true);
    });


    function sendCheck(data, whisper) {
        var isMe = data.username == userinfo.username;
        if (whisper) {
            // sendPrivateMessage(data.message, data.username, isMe, data.images, data.time || data.created);
            sendPrivateMessage(data, isMe);
            return false;
        }
        //sendMessage(data.message, data.username, isMe, data._id, data.images, data.time || data.created);
        sendMessage(data, isMe);
    }

    function temporarySwap(array) {
        var left = null;
        var right = null;
        var length = array.length;
        for (left = 0, right = length - 1; left < right; left += 1, right -= 1) {
            var temporary = array[left];
            array[left] = array[right];
            array[right] = temporary;
        }
        return array;
    }

    socket.on('clients:get:history', function (data) {
        var history = temporarySwap(data);
        _.each(history, function (record) {
            sendCheck(record, false)
        });
    });

    socket.on("chat:disconnect", function(){
        location.href = "/";
    });

    socket.on('clients:get:online', function (users) {
        console.log(users);
        users.forEach(function (user) {
                $('#connected_users').append("<p class='user-field'>" + user + "</p>");
                _users.push(user);
            }
        );
    });

    socket.on('clients:get:information', function (data) {
        userinfo = _.clone(data);
        console.log(userinfo);
    });

    socket.on('clients:join', function (username) {
        console.log(username);
        $('#connected_users').append("<p class='user-field'>" + username + "</p>");
        sendMOTD(username + " connected");
    });

    socket.on('not logged in', function () {
        location.href = "/login";
    });
    function parseId(id) {
        return id.substring(4);
    }

    function showInfo(msg, cls){
        var $infoBlock = $('.info-wrapper');
        var p = $('<p/>', {}).text(msg);
        $infoBlock.append(p);
        $infoBlock.addClass(cls).removeClass('hidden');
        setTimeout(function () {
            p.remove();
            $infoBlock.removeClass(cls).addClass('hidden');
        }, 3000);
    }

    socket.on('client:info', function (msg, cls) {
        showInfo(msg, cls);
    });

    socket.on('chat:edit_message', function (msg, id) {
        $('#msg_' + id).text(msg);
    });

    socket.on('clients:leave', function (username) {
        $(".user-field:contains('" + username + "')").remove();
    });


    $(document).on('click', '.user-field', function () {
        var username = $(this).text();
        var prev_msg = $chat_text.val();
        var new_msg = "/w " + username + " " + prev_msg;
        $chat_text.val(new_msg);
    });
    $(document).on('click', '.chat-image-close', function () {
        var parent = $(this).parent();
        var url = $('img', parent).attr('src');
        _.each(imagesArray, function (image) {
            if (url === image) {
                var pos = imagesArray.indexOf(image);
                console.log(pos);
                imagesArray.splice(pos, 1);
            }
        });
        parent.remove();
    });

    var renderImage = function (src, li) {
        li.append($('<img />', {
            src: src,
            class: 'render-chat-image'
        }));
        $messages.append(li);
    };

    var displayImages = function (li, images) {
        if (images.length > 0) {
            _.each(images, function (src) {
                renderImage(src, li);
            });
        }
    };

    var scrollAppend = function (li, images) {
        if ($messages[0].scrollTop + $messages.height() + 1 >= $messages[0].scrollHeight) {
            $messages.append(li);
            displayImages(li, images);
            $messages.scrollTop($messages[0].scrollHeight);
        }
        else {
            $messages.append(li);
            displayImages(li, images);
        }
    };
    var normalizeDate = function (date) {
        var monthNames = [
            "January", "February", "March",
            "April", "May", "June", "July",
            "August", "September", "October",
            "November", "December"
        ];

        var date = new Date(date);
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var result = (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes) + ', ';
        var day = date.getDate();
        var monthIndex = date.getMonth();
        var year = date.getFullYear();
        return result + ' ' + day + ' ' + monthNames[monthIndex] + ' ' + year;
    };
    var lastMessageData = {},
        lastMessageElement,
        joinMsgLimit = 5 * 60 * 1000;
        // messages with difference > 5 minutes dont join
    var sendMessage = function (data, isMe) {
        data.time = data.time || data.created;

        var me = isMe ? ' me' : '';
        var p = $("<p>", {
            'class': 'message-header'
        }).text(data.username);
        var p2 = $("<p>", {
            'class': 'message'
        }).text(data.message);
        var p3 = $("<p>", {
            'class': 'message-date'
        }).text(normalizeDate(data.time));

        var li = $("<li>", {
            'id': 'msg_' + data._id,
            'class': 'message-wrapper public' + me
        });
        li.append(p);
        li.append(p2);
        scrollAppend(li, data.images);
        li.append(p3);

        if(data.username == lastMessageData.username
            && new Date(data.time) - new Date(lastMessageData.time) <= joinMsgLimit){
            // messages joining
            p.css('visibility', 'hidden');
            lastMessageElement.css('padding-bottom', 15);
            li.css('padding-top', 15);
            lastMessageElement.css('border-bottom', 0);
        }

        lastMessageData = data;
        lastMessageElement = li;
    };

    var sendPrivateMessage = function (data, isMe) {
        var me = isMe ? ' me' : '';
        var p = $("<p>", {
            'class': 'message-header'
        }).text(data.username);
        var p2 = $("<p>", {
            'class': 'message'
        }).text(data.message);
        var p3 = $("<p>", {
            'class': 'message-date'
        }).text(normalizeDate(data.time || data.created));

        var li = $("<li>", {
            'class': 'message-wrapper private' + me
        });

        li.append(p);
        li.append(p2);
        li.append(p3);
        scrollAppend(li, data.images);
    };

    var sendMOTD = function (message) {
        var p1 = $("<p>", {
            'class': 'message'
        }).text(message);
        var li = $("<li>", {
            //'id': 'msg_' + id,
            'class': 'message-wrapper public',
            css: {
                'text-align': 'center'
            }
        });
        li.append(p1);
        scrollAppend(li, im1ages = []);
    };
}