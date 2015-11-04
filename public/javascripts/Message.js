var $messagesContainer;

var Message = function(data){
    this.message = data.message || "";
    this.username = data.username;
    this.date = data.time || data.created;
    this.images = data.images;
    this.type = data.type;
    this.id = data.id || "";
};

Message.prototype.normalizeDate = function(_date){

    var date = new Date(_date);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    return (hours < 10 ? "0" + hours : hours) + ":" + (minutes < 10 ? "0" + minutes : minutes);
};

var lastMessageData = {},
    lastMessageElement,
    joinMsgLimit = 5 * 60 * 1000;

Message.prototype.sendMessage = function(obj){

    $messagesContainer = $('input[data-id=' + obj.id +']').closest('.panel').find('#msgs');
    console.log($messagesContainer);
    var isMe = false;
    if(obj.username === this.username){
        isMe = true;
    }
    var typeOfPrivate = this.type === "private" ? " private" : " public";
    var me = isMe ? ' me' : '';

    var p = $("<p>", {
        'class': 'message-header'
    }).text(this.username);
    var p2 = $("<p>", {
        'class': 'message'
    }).text(this.message);
    var p3 = $("<p>", {
        'class': 'message-date'
    }).text(this.normalizeDate(this.date));

    var li = $("<li>", {
        'id': 'msg_' + this.id,
        'class': 'message-wrapper' + typeOfPrivate + me
    });

    li.append(p);
    li.append(p2);
    li.append(p3);



    if(this.username == lastMessageData.username
        && new Date(this.date) - new Date(lastMessageData.time) <= joinMsgLimit){
        // messages joining
        p.css('visibility', 'hidden');
        lastMessageElement.css('padding-bottom', 15);
        li.css('padding-top', 15);
        lastMessageElement.css('border-bottom', 0);
    }
    var data = {
        message: this.message,
        username: this.username,
        time: this.date
    };

    this.scrollAppend(li, this.images);
    lastMessageData = data;
    lastMessageElement = li;
};

Message.prototype.scrollAppend = function(li, images){
    if ($messagesContainer[0].scrollTop + $messagesContainer.height() + 1 >= $messagesContainer[0].scrollHeight) {
        $messagesContainer.append(li);
        this.displayLinks(li);
        this.displayImages(li, images);
        $messagesContainer.scrollTop($messagesContainer[0].scrollHeight);
    }
    else{
        $messagesContainer.append(li);
        this.displayLinks(li);
        this.displayImages(li, images);
    }
};

Message.prototype.displayImages = function(li, images){
    var self = this;
    if (images.length > 0) {
        _.each(images, function (src) {
            self.renderImage(src, li);
        });
    }
};
Message.prototype.displayLinks = function(li){
    var t = li.html();
    t = t.replace(/((http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?)/gi, '<a href="$1" target="_blank">$1</a>');
    li.html(t);
};

Message.prototype.renderImage = function(src, li){
        li.append($('<img />', {
            src: src,
            class: 'render-chat-image'
        }).overlay());
        $messagesContainer.append(li);
};

