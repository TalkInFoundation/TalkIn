var init = function(option) {
    $('.scrollbar-macosx').scrollbar();
    var $slug = $('.slug').attr('id');
    console.log($slug);
    var socket = io.connect('/conferences', {query: 'slug=' + $slug + "&" + "typeOfUser=" + typeOfUser});
    var $chat_text = $('#chat_text');
    var $messages = $('#msgs');
    var $imagePlaceholder = $('.image-placeholder');
    var usersOnline = [];
    var userinfo = {};
    var imagesArray = [];

    var USER_STATUS = {
        OFFLINE: "Offline",
        ONLINE: "Online"
    };





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
    var typing = false;
    var timeout = undefined;

    function typingTimeOut(){
        typing = false;
        socket.emit('clients:typing', {typing: false, username: userinfo.username});
    }

    $chat_text.keypress(function (e) {
        var message = $chat_text.val();
        if (message.replace(/[\s\t\n]/g, '') == '' && !imagesArray.length > 0)
            return;

        if(e.which !== 13){ // typing event
            if(typing == false){
                typing = true;
                socket.emit('clients:typing', {typing: true, username: userinfo.username});
            }
            else{
                clearInterval(timeout);
                timeout = setInterval(typingTimeOut, 3000);
            }
        }

        if (e.which == 13 && !e.shiftKey) {
            if (message.length > 0 || imagesArray.length > 0) {
                if (message.length > 3) {
                    var whisper_regex = /^[\\\/]w\s([A-Za-z0-9_]+)\s(.*)/i;
                    var match = message.match(whisper_regex);
                    if (match) {//if username and msg provided
                        var to = match[1];
                        var msg = match[2];
                        if (to === userinfo.username) return false;// we don't need to send private messages to ourselves
                        console.log(to, " ", usersOnline);
                        if ($.inArray(to, usersOnline) !== -1) {
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
                                images: imagesArray,
                                type: "private"
                            };
                            new Message(data).sendMessage(userinfo.username);
                            imagesArray = [];
                            $imagePlaceholder.empty();
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
        new Message(data).sendMessage(userinfo.username);
        $(".typing#"+data.username+"").remove();
        clearTimeout(timeout);
        timeout = setTimeout(typingTimeOut, 0);
    });

    socket.on('chat:send_message:private', function (data) {
        new Message(data).sendMessage(userinfo.username);
        $(".typing#"+data.username+"").remove();
        clearTimeout(timeout);
        timeout = setTimeout(typingTimeOut, 0);
    });

    socket.on('clients:typing', function(data){
        if(data.typing){
            var $typingBlock = $('.typing-display');
            if($typingBlock.has('span').length){
                var $text = $('.typing-display span').text();
                console.log($text);
                var position = /(is|are)/.exec($text).index;
                var sub = ", " + data.username;
                var outputText = $text.substr(0, position) + sub + " are typing";
                $('.typing-display span').text(outputText);
                return;
            }
            $typingBlock.append('<span class="typing" id="' + data.username + '">' + data.username + ' is typing</span>');
            timeout = setTimeout(typingTimeOut, 3000);
        }
        else{
            $('.typing#'+data.username).remove();
        }
    });


    //function sendCheck(data, whisper) {
    //    var isMe = data.username == userinfo.username;
    //    if (whisper) {
    //        // sendPrivateMessage(data.message, data.username, isMe, data.images, data.time || data.created);
    //        sendPrivateMessage(data, isMe);
    //        return false;
    //    }
    //    //sendMessage(data.message, data.username, isMe, data._id, data.images, data.time || data.created);
    //    sendMessage(data, isMe);
    //}

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
            new Message(record).sendMessage(userinfo.username);
        });
    });

    socket.on("chat:disconnect", function(){
        location.href = "/";
    });

    socket.on('clients:get:online', function (users) {
        for(var u in users){
            var $userField = $('.user-field:contains('+ u +')');
            if($userField.hasClass(USER_STATUS.OFFLINE)){
                $userField.removeClass(USER_STATUS.OFFLINE);
            }
            if($userField.hasClass(USER_STATUS.ONLINE)){
                $userField.remove(USER_STATUS.ONLINE);
            }
            $userField.addClass(users[u]);
            if(users[u] === USER_STATUS.ONLINE){
                usersOnline.push(u);
            }
        }
    });

    socket.on('clients:get:information', function (data) {
        userinfo = _.clone(data);
        data.conferenceUsers.forEach(function(user){
            if(userinfo.username != user) {
                $('#connected_users').append("<p class='user-field'>" + user + "</p>");
            }
        });
    });

    //socket.on('clients:join', function (username) {
    //    console.log(username);
    //    $('#connected_users').append("<p class='user-field'>" + username + "</p>");
    //    sendMOTD(username + " connected");
    //});


    socket.on('not logged in', function () {
        location.href = "/login";
    });

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
        var userField = $(".user-field:contains('" + username + "')");

        userField.removeClass(USER_STATUS.ONLINE).addClass(USER_STATUS.OFFLINE);

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


};