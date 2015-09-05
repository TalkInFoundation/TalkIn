var mongoose = require('mongoose');

var options = {
  server: {
      socketOptions: {
          keepAlive: 1
      }
  }
};

mongoose.connect('mongodb://localhost/chat', options);

exports.db = mongoose;
