var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');
var mongoose = require('./libs/mongoose').db;

var AuthError = require('./errors/AuthError').AuthError;
var adminPanel = require('./routes/admin');
var logout = require('./routes/logout');
var main = require('./routes/main');
var room = require('./routes/room');
var session = require('express-session');
var registration = require('./routes/registration');
var login = require('./routes/login');
var profile = require('./routes/profile');
var app = express();
var http = require('http').Server(app);
var io = require('./socket')(http);
app.set('io', io);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
var MongoStore = require('connect-mongo')(session);
var sessionStore = require('./libs/sessionStore');
app.use(cookieParser(config.get('session:secret')));
app.use(session({
    secret: config.get('session:secret'),
    name: config.get('session:key'),
    store: sessionStore,
    resave: config.get('session:resave'),
    saveUninitialized: config.get('session:saveUninitialized')
}));


app.use(express.static(path.join(__dirname, 'public')));
var checkAuth = require('./middleware/checkAuth');
app.use(require('./middleware/usermiddleware'));


//Routes
app.use(adminPanel);
app.use(profile);
app.use(room);
app.use(registration);
app.use(login);
app.use(logout);
app.use(main);

//redirect if autherror on /login url


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use(function(err, req, res, next){
    if(err instanceof AuthError){
        var msg = err.message;
        req.session.isAuthError = true;
        res.redirect('/login');
        next();
    }
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

http.listen(3000, function(){
    console.log('Server started. Port: 3000');
});



module.exports = app;
