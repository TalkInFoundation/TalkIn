/**
 * Created by saucebwz on 30.10.2015.
 */
var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;


var schema = new Schema({
    username: {
        type: String
    },
    conferences: {
        type: String
    }
});


exports.Contacts = mongoose.model('Contacts', schema);