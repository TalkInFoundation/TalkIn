Widget.widgets['SearchContacts'] = {
    title: 'Find Contact/Conference',
    left: 0,
    width: 300,
    make: function(params){
        var self = this;
        $.ajax({
            method: "GET",
            url: "/renderwidget/searchcontacts",
            data: {},
            success: function(data){
                self.$content.html(data);
                $(document).on('click', '.add-friend', function(){
                    var contact = $(this).attr('id');
                    $.ajax({
                        method: "POST",
                        url: "/addfriend",
                        data:{ contact: contact },
                        success: function(data){

                        }
                    });
                });
                $(document).on('keypress', '.search-contacts--wrapper input', function(e){
                    if (e.which == 13){
                        var contact = $(this).val();
                        $.ajax({
                            method: "POST",
                            url: "/searchcontact",
                            data: { contact: contact },
                            success: function(contacts){
                                var $resultsWrapper = $('.search-contacts--results');
                                var found = contacts.data;
                                if(contacts.status === "success"){
                                    console.log(found);
                                    if(found.length > 1){
                                        found.forEach(function(contact){
                                            var li = $("<li></li>", {
                                                'class': 'search-contact-row'
                                            }).text(contact.username);
                                            li.append('<a class="add-friend" id="' + contact.username + '"> Add Friend</a>');
                                            $resultsWrapper.append(li);
                                        });
                                    }
                                    else{
                                        $resultsWrapper.append("<li></li>",{
                                            'class': 'search-contact-row no-contact'
                                        }).text("Not found");
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
    }
};