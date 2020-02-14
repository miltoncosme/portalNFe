var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var indexRouter = require('./routes/index');
var usuariosRouter = require('./routes/usuarios');
var empresasRouter = require('./routes/empresas');
var nfeRouter = require('./routes/nfe');
var nfceRouter = require('./routes/nfce');
var loginRouter = require('./routes/login');
var apiRouter = require('./routes/api');
var tokenRouter = require('./routes/token');
var bodyParser = require('body-parser')
const session = require("express-session");
const flash = require("connect-flash");
const app = express();
const passport = require("passport");
require("./config/auth")(passport);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//
app.use(bodyParser.json({limit: '1mb', extended: true}));
//
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
  secret:process.env.SECRET_WEB,
  resave: true,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());


// rotas
app.use('/', indexRouter);
app.use('/empresas', empresasRouter);
app.use('/usuarios', usuariosRouter);
app.use('/nfe', nfeRouter);
app.use('/nfce', nfceRouter);
app.use('/server', apiRouter);
app.use('/login', loginRouter);
app.use('/token', tokenRouter);

// Logout no passport
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/login');
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
  res.render('error', { 
    titulo: 'mCloud' 
  }  
  );
});

module.exports = app;
