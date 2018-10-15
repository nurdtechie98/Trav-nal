var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var multer = require('multer');
var session = require('express-session');
var upload = multer();

// set database
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/my_db');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views')); //load view directory
app.set('view engine', 'ejs'); //use ejs engine

// middlewares
app.use(logger('dev'));
app.use(express.json()); //body-parser for requests
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(upload.array()); //multipart form using multer
app.use(session({secret: "Your secret key"}));

app.use(express.static(path.join(__dirname, 'public'))); //load static directory

// add db to req object
app.use(function(req,res,next){
  req.db = db;
  next();
});

// assign routers
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
