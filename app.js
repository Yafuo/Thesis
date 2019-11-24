var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var {checkLogin} = require('./custom_lib/authenticate');
var {hash, compare} = require('./custom_lib/bcrypt');
var {verify, sign} = require('./custom_lib/jwt');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var http = require('http');
var server = http.createServer(app);
var io = require('socket.io')(server);

app.io = io;

server.listen(3000);

var User = require('./models/user');
var mongoose = require('mongoose');
// mongoose.connect('mongodb+srv://Yafuo:phuanhdai@node-smart-parking-btryk.mongodb.net/test?retryWrites=true'
//     , {useNewUrlParser: true});
mongoose.connect('mongodb+srv://Yafuo:phuanhdai@node-smart-parking-btryk.mongodb.net/real?retryWrites=true&w=majority'
    , {useNewUrlParser: true, useFindAndModify: false, useUnifiedTopology: true});
// mongoose.set('useFindAndModify', false);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use('/public', express.static(path.join(__dirname, 'public')));
// app.use('/services', express.static(path.join(__dirname, 'services')));
app.use(express.static(path.join(__dirname)));
// app.use(express.static(__dirname + '../public'));
// console.log(__dirname);

app.use('/api', indexRouter);
app.use('/users', usersRouter);
io.on('connection', function (socket) {
  console.log('You are connected!');
  // socket.emit('news', {test: 'yafuo'});
});
app.post('/userAlarm', (req, res) => {
  // console.log(`body: ${JSON.stringify(req.body)}`);
  const user = new User({
    userSlot: parseInt(req.body.userSlot),
    userAlarm: req.body.userAlarm
  });
  User.findOneAndUpdate({userSlot: user.userSlot}, {userAlarm: user.userAlarm}).then(updatedUser => {
    if (!updatedUser) {
      user.save().then(result => {
        console.log('CREATED '+result);
      }).catch(err => {
        console.log(err);
      });
      res.status(201).send(user);
    }
    res.status(200).json({UPDATED: updatedUser});
  }).catch(err => {
    res.status(404);
  });
});

app.get('/userAlarm/get-all-user', (req, res) => {
  User.find().exec().then(result => {
    res.status(200).json(result);
  }).catch(err => {
    res.status(500).json({error : err});
  });
});

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

module.exports = {app, io};
