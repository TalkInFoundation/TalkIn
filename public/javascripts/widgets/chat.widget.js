/**
 * Created by saucebwz on 03.11.2015.
 */
Widget.widgets['Chat'] = {
    title: 'Chat',
    left: 0,
    width: 500,
    make: function(params){
        var self = this;
        this.$hidden.attr('data-id', params.id);
        $.ajax({
            method: "GET",
            url: "/renderwidget/chat",
            data: {typeOfUser: params.typeOfUser},
            success: function(data){
                self.$content.html(data);
                self.socket.emit('clients:get:history', params.id);
                self.socket.emit('clients:join', params.id);
                if(typeOfUser === "admin"){
                    var adminWidget = new Widget('ConferenceAdmin', {id: params.id})
                }
            }
        });
        //var $textarea = $("<textarea></textarea>", {
        //    'class': 'chat-text',
        //    'id': 'chat_text',
        //    'placeholder': 'Type your message here'
        //});
        //var $connectedUsers = $("<div></div>", {
        //    'id':'connected_users'
        //});
        //var $ul = $("<ul></ul>", {
        //    'class': 'messages scrollbar-macosx',
        //    'id': 'msgs'
        //});
        //var $imagePlaceholder = $("<div></div>", {
        //    'class': 'image-placeholder'
        //});
        //this.$content.append($connectedUsers);
        //this.$content.append($ul);
        //this.$content.append($textarea);
        //this.$content.append($imagePlaceholder);
    }
};