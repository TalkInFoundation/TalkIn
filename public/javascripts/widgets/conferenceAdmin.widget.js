/**
 * Created by saucebwz on 03.11.2015.
 */
Widget.widgets['ConferenceAdmin'] = {
    title: 'Admin Panel',
    left: 0,
    width: 500,
    make: function(params){
        var self = this;
        this.$hidden.attr('data-id', params.id);
        $.ajax({
            method: "GET",
            url: "/renderwidget/conferenceAdmin",
            data: {typeOfUser: params.typeOfUser},
            success: function(data){
                self.$content.html(data);
                self.socket.emit('clients:get:history', params.id);
                self.socket.emit('clients:join', params.id);
            }
        });
    }
};