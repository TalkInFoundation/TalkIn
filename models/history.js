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
    },
    conference: {
        type: Schema.Types.ObjectId,
        required: true
    },
    images: {
        type: [String]
    }

});

exports.History = mongoose.model('History', schema);