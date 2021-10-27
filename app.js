var createError = require ('http-errors'),
  compression = require ('compression'),
  path = require ('path'),
  express = require ('express');
var app = express ();
var sevenDays = 604800000;
 
app.use (compression ());
app.use (express.static (path.join (__dirname, 'public'), {maxAge: sevenDays}));

var cookieParser = require ('cookie-parser'),
  logger = require ('morgan'),
  {sqlMethods} = require ('./user-methods/sql-methods'),
  bookingsRouter = require ('./routes/bookings'),
  signupRouter = require ('./routes/signup'),
  loginRouter = require ('./routes/login'),
  centersRouter = require ('./routes/centers'),
  usersRouter = require ('./routes/users'),
  organisationsRouter = require ('./routes/organisations'),
  settingsRouter = require ('./routes/settings'),
  termsRouter = require ('./routes/terms'),
  privacyRouter = require ('./routes/privacy'),
  refundRouter = require ('./routes/refund'),
  learnMoreRouter = require ('./routes/learn-more'),
  apiRouter = require ('./routes/api'),
  cookieParser = require ('cookie-parser'),
  session = require ('express-session'),
  passport = require ('passport'),
  connectEnsureLogin = require ('connect-ensure-login'),
  rateLimit = require ('express-rate-limit'),
  MySQLStore = require ('express-mysql-session') (session);

const dotenv = require ('dotenv');
dotenv.config ();
const {SQL_HOST, SQL_PORT, SQL_USER, SQL_PWD, SQL_DBNAME} = process.env;
var sessionStore = new MySQLStore ({
  host: SQL_HOST,
  port: SQL_PORT,
  user: SQL_USER,
  password: SQL_PWD,
  database: SQL_DBNAME,
});
var {auth} = require ('./auth');

sqlMethods.initTables ();
var connection = sqlMethods.getConnection ();

// view engine setup
app.set ('views', path.join (__dirname, 'views'));
app.set ('view engine', 'ejs');

const limiter = rateLimit ({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 10000, // limit each IP to 100 requests per windowMs
});
//app.use(limiter);

app.use(logger("dev"));
app.use (
  express.json ({
    limit: '20mb',
  })
);
app.use (
  express.urlencoded ({
    limit: '20mb',
    parameterLimit: 100000,
    extended: true,
  })
);
app.use (
  session ({
    secret: 'eHu6FRkxDWFyfk2aZYLDL4Un4SwGyDt93kmDKzBAzQbYwmCo1595ye0EZ5lYEEC8EygetRBUlEATCblrEuFy6c3Jh8iZW4x1AHj',
    store: sessionStore,
  })
);
app.use (passport.initialize ());
app.use (passport.session ());

app.use (cookieParser ());

passport.serializeUser (function (user, done) {
  done (null, user.id);
});

passport.deserializeUser (function (id, done) {
  connection.query ('select * from users where id = ' + id, function (
    err,
    rows
  ) {
    done (err, rows[0]);
  });
});

passport.use (auth.strategy ());

app.post ('/login', (req, res, next) => {
  passport.authenticate ('local', (err, user, info) => {
    if (err) {
      return next (err);
    }
    if (!user) {
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      return res.json (info);
    }
    req.logIn (user, function (err) {
      if (err) {
        return next (err);
      }
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      return res.json (info);
    });
  }) (req, res, next);
});

app.use ('/api', connectEnsureLogin.ensureLoggedIn (), apiRouter);
//app.use("/api", apiRouter);

app.use ('/login', loginRouter);
app.use (
  '/signup',
  sqlMethods.verifyChangePassword.bind (sqlMethods),
  signupRouter
);
app.use ('/change-password', signupRouter);
app.get ('/logout', function (req, res) {
  req.logout ();
  res.redirect ('/');
});
app.use ('/centers', connectEnsureLogin.ensureLoggedIn (), centersRouter);
//app.use("/centers",centersRouter);

app.use ('/users', connectEnsureLogin.ensureLoggedIn (), usersRouter);
//app.use("/users",usersRouter);

app.use ('/settings', connectEnsureLogin.ensureLoggedIn (), settingsRouter);

app.use (
  '/organisations',
  connectEnsureLogin.ensureLoggedIn (),
  organisationsRouter
);

app.use ('/terms', termsRouter);

app.use ('/privacy-policy', privacyRouter);
app.use ('/refund-policy', refundRouter);
app.use ('/learn-more', learnMoreRouter);

app.get ('/', function (req, res) {
  res.redirect ('/login');
});
app.use ('/bookings', connectEnsureLogin.ensureLoggedIn (), bookingsRouter);
//app.use("/", indexRouter);

// catch 404 and forward to error handler
app.use (function (req, res, next) {
  next (createError (404));
});

// error handler
app.use (function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get ('env') === 'development' ? err : {};

  // render the error page
  res.status (err.status || 500);
  res.send (err.message);
});

module.exports = app;
