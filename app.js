var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var config = require('./config');
var mongoose = require('./libs/mongoose').db;

var AuthError = require('./errors/AuthError').AuthError;


var routes = require('./routes/index');
var session = require('express-session');
var users = require('./routes/users');
var registration = require('./routes/registration');
var login = require('./routes/login');
var app = express();
var http = require('http').Server(app);

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

app.use(require('./middleware/usermiddleware'));
var checkAuth = require('./middleware/checkAuth');



//Routes
app.use('/', routes);
app.use('/users', users);
app.post('/registration', registration.post);
app.use('/registration', registration.get);
app.post('/login', login.post);
app.use('/login', login.get);
app.post('/logout', login.logout);


//redirect if autherror on /login url
app.use(function(err, req, res, next){
    if(err instanceof AuthError){
        var msg = AuthError.message;
        res.redirect('/login');
        next();
    }
    next(err);
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
      console.log(err.stack);
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
var io = require('./socket')(http);
app.set('io', io);

module.exports = app;
