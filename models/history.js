var mongoose = require('../libs/mongoose').db,
    Schema = mongoose.Schema;


var schema = new Schema({
    username: {
        type: String
    },
    message: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    }

});

exports.History = mongoose.model('History', schema);