var mysql = require('mysql');
const dotenv = require('dotenv');
dotenv.config();
const {SQL_HOST, SQL_PORT, SQL_USER, SQL_PWD, SQL_DBNAME} = process.env;

var pool = mysql.createPool({
  host: SQL_HOST,
  port: SQL_PORT,
  user: SQL_USER,
  password: SQL_PWD,
  database: SQL_DBNAME,
  multipleStatements: true,
});

module.exports = {
    query: function(){
        var sql_args = [];
        var args = [];
        for(var i=0; i<arguments.length; i++){
            args.push(arguments[i]);
        }
        var callback = args[1] || function(){}; //second arg is callback
        pool.getConnection(function(err, connection) {
        if(err) {
                console.log(err);
                return callback(err);
            }
            if(args.length > 2){
                sql_args = args[1];
            }
        connection.query(args[0], sql_args, function(err, results) {
          connection.release(); // always put connection back in pool after last query
          if(err){
            console.log(err);
            return callback(err);
            }
          callback(null, results);
        });
      });
    },
    connect: function(){
        var sql_args = [];
        var args = [];
        for(var i=0; i<arguments.length; i++){
            args.push(arguments[i]);
        }
        var callback = args[args.length-1]; //last arg is callback
        pool.getConnection(callback);
    },
};