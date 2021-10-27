var { sqlMethods } = require("./user-methods/sql-methods"),
  LocalStrategy = require("passport-local");
var sha256 = require("crypto-js/sha256");


var auth = {
  strategy: function strategy() {
    return new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      function (req, email, password, done) {


        sqlMethods.getUserByEmail(email).then((rows) => {
          if (!rows.length) {
          
            return done(
              null,
              false,
              {message: "User not found" }
            );
          }
          let encryptedPassword = sha256(password +rows[0].salt).toString();

          if (!(rows[0].password.toLowerCase() === encryptedPassword))
            return done(
              null,
              false,
              {message: "Wrong Password" }
            );
            // rows[0].permissions = rows[0].permissions ? JSON.parse(rows[0].permissions): '';
            //console.log(typeof rows[0].permissions);
 
          return done(null, rows[0], {message: "Success" });
        }).catch(err=>console.log(err.message));
      }
    );
  },
};

exports.auth = auth;

