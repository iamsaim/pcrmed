const mailer = require ('./mailer');
mailer.init ();
var sha256 = require ('crypto-js/sha256');
var {defaultValues} = require ('../defaults');

var connection = require ('./mysql-middleware.js');

/**
 * Use methods proto
 * @type {object}
 */

//TODO: Refactor db client to not send queries and only api requests.
var sqlMethods = {
  initTables: function initTables () {
    connection.connect (function (err) {
      if (!err) {
        console.log ('Connected!');

        //Check for users tables.
        var sql1 = `SHOW TABLES LIKE 'orgs';`;
        connection.query (sql1, function (err, result) {
          if (!result[0]) {
            var sql = `CREATE TABLE orgs (id INT AUTO_INCREMENT PRIMARY KEY, org_name VARCHAR(255) UNIQUE,settings MEDIUMTEXT, admin_name VARCHAR(255), admin_email VARCHAR(255))`;

            connection.query (sql, function (err, result) {
              if (err) throw err;
              console.log ('Orgs Table created');
            });
          }
        });
        //TODO: Add org_id column
        //Check for users tables.
        var sql2 = `SHOW TABLES LIKE 'users';`;
        connection.query (sql2, function (err, result) {
          if (!result[0]) {
            var sql = `CREATE TABLE users (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(150) UNIQUE, name VARCHAR(255),
                  password VARCHAR(255), salt VARCHAR(10), date_created BIGINT(40),role VARCHAR(50), permissions VARCHAR(500),assigned_location VARCHAR(100),status VARCHAR(50), activation_token VARCHAR(50),org_name VARCHAR(255))`;

            connection.query (sql, function (err, result) {
              if (err) throw err;
              console.log ('User Table created');
            });
          }
        });
      } else {
        console.error ('error connecting: ' + err.stack);
      }
    });
    this.connection = connection;
  },
  getBookingTableColumns: function getBookingTableColumns () {
    var columns = {
      custom_id: 'Booking ID',
      ticket: 'Voucher',
      name: 'Passenger name',
      dob: 'Passenger dob',
      service: 'Service',
      departure: 'Travel date',
      phone: 'Phone',
      email: 'Email',
      nationality: 'Nationality',
      passport_id: 'Passport/UAE ID',
      passport_expiry: 'Passport/UAE ID Expiry',
      booking_agent: 'Booking agent',
      booking_date: 'Booking date',
      status: 'Status',
      lpo_number: 'LPO Number',
      invoice: 'Invoice',
      center_name: 'Center Name',
      fulfillment_date: 'Fulfillment Date',
    };

    return columns;
  },

  createBookingsTableIfNone: function createBookingsTableIfNone (
    orgName,
    resolve
  ) {
    //Check for passengers tables.
    //TODO: Return a promise
    var sql = `SHOW TABLES LIKE 'passengers_${orgName}';`;
    var columns;
    connection.query (sql, function (err, result) {
      if (!result[0]) {
        var sql = `CREATE TABLE passengers_${orgName} (id INT AUTO_INCREMENT PRIMARY KEY, custom_id VARCHAR(20) UNIQUE,ticket VARCHAR(100) UNIQUE, name VARCHAR(255),dob  INT(20),
              service VARCHAR(255), departure INT(20),phone BIGINT(15), email VARCHAR(150), nationality VARCHAR(150), passport_id VARCHAR(255), 
              passport_expiry INT(20), booking_agent VARCHAR(255), booking_date INT(20), status VARCHAR(100), lpo_number VARCHAR(100), invoice VARCHAR(255),
                center_name VARCHAR(100), fulfillment_date INT(20))`;
        connection.query (sql, function (err, result) {
          if (err) throw err;
          var sql2 = `SHOW TABLES LIKE 'custom_id_pool_${orgName}';`;
          connection.query (sql2, function (err, result) {
            if (!result[0]) {
              var sq3 = `CREATE TABLE custom_id_pool_${orgName} (
                id INT AUTO_INCREMENT PRIMARY KEY,
                locked BOOLEAN DEFAULT false
              )`;
              connection.query (sq3, function (err, result) {
                if (err) throw err;
                resolve ();
                console.log ('Custom Id Table created');
              });
            }
          });
        });
      }
    });
  },
  createCentersTableIfNone: function createCentersTableIfNone (
    orgName,
    resolve
  ) {
    //Check for centers tables.
    var sql = `SHOW TABLES LIKE 'centers_${orgName}';`;

    //Check for centers tables.
    connection.query (sql, function (err, result) {
      if (!result[0]) {
        var sql = `CREATE TABLE centers_${orgName} (
          id INT AUTO_INCREMENT PRIMARY KEY,
          center_id VARCHAR(100),
          center_name VARCHAR(255),
          concerned_person VARCHAR(255),
          phone VARCHAR(20), 
          email VARCHAR(100),
          timings VARCHAR(100),
          address text, 
          google_map text
        )
        `;

        connection.query (sql, function (err, result) {
          if (err) throw err;
          resolve ();
        });
      }
    });
  },

  saveOrgSettings: function saveOrgSettings (req, res, next) {
    var sql = `UPDATE orgs SET settings='${req.body.settings}' WHERE org_name='${req.user.org_name === 'All' ? req.body.orgName : req.user.org_name}'`;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  getOrgSettingsAjax: function getOrgSettingsAjax (req, res, next) {
    var sql = `SELECT settings from orgs WHERE org_name='${req.user.org_name === 'All' ? req.body.orgName : req.user.org_name}'`;
    var allBookingColumns = this.getBookingTableColumns ();

    connection.query (sql, function (err, result) {
      if (!err) {
        var settings = null;

        try {
          settings = JSON.parse (result[0].settings);
        } catch (e) {
          settings = {};
        }
        settings = settings || {};

        settings.allowedBookingColumnsKey = settings.allowedBookingColumnsKey || Object.keys (allBookingColumns);
        

        //Only admins and owner can see these values.
        if (!['Owner','Admin'].includes(req.user.role)) {
          settings.allowedBookingColumnsKey = settings.allowedBookingColumnsKey.filter (
            key =>
              ![
                'status',
                'lpo_number',
                'invoice',
                'center_name',
                'fulfillment_date',
              ].includes (key)
          );
        }

        if(req.user.permissions.includes('Change booking status')){
          settings.allowedBookingColumnsKey  = [...new Set([...settings.allowedBookingColumnsKey,'status'])];
        }
        
        settings.allowedBookingColumnsValue = settings.allowedBookingColumnsKey.map (
          key => {
            return allBookingColumns[key];
          }
        );

        for (let key in defaultValues) {
          if (
            typeof settings[key] === 'undefined' ||
            (typeof defaultValues[key] === 'string' && settings[key].length < 1)
          ) {
            settings[key] = defaultValues[key];
          }
        }

        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          settings: JSON.stringify (settings),
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  getOrgSettings: function getOrgSettings (req, res, next) {
    var allBookingColumns = this.getBookingTableColumns ();
    var orgName = req.body.orgName || req.user.org_name;

    if (req.user.org_name !== orgName && req.user.org_name !== 'All') {
      res.statusCode = 403;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'failed',
      });
      return;
    }

    var sql = `SELECT settings from orgs WHERE org_name='${orgName}'`;
    connection.query (sql, function (err, result) {
      if (!err) {
        var settings = null;

        try {
          settings = JSON.parse (result[0].settings);
        } catch (e) {
          settings = {};
        }
        settings = settings || {};

        for (let key in defaultValues) {
          if (
            typeof settings[key] === 'undefined' ||
            (typeof defaultValues[key] === 'string' && settings[key].length < 1)
          ) {
            settings[key] = defaultValues[key];
          }
          res.locals.userData[key] = settings[key];
        }

        if (orgName === 'All') {
          res.locals.userData.allowedBookingColumnsKey = Object.keys (
            allBookingColumns
          );
          res.locals.userData.allowedBookingColumnsValue = Object.values (
            allBookingColumns
          );
          next ();
          return;
        } else {
          res.locals.userData.allowedBookingColumnsKey = settings &&
            settings.allowedBookingColumnsKey
            ? settings.allowedBookingColumnsKey
            : Object.keys (allBookingColumns);

           //Only admins and owner can see these values.
          res.locals.userData.allowedBookingColumnsKey =  !['Owner','Admin'].includes(req.user.role) ? res.locals.userData.allowedBookingColumnsKey.filter (
            key =>
              ![
                'status',
                'lpo_number',
                'invoice',
                'center_name',
                'fulfillment_date',
              ].includes (key)
          ):res.locals.userData.allowedBookingColumnsKey;

          if(req.user.permissions.includes('Change booking status')){
            res.locals.userData.allowedBookingColumnsKey  = [...new Set([...res.locals.userData.allowedBookingColumnsKey,'status'])];
          }

          res.locals.userData.allowedBookingColumnsValue = res.locals.userData.allowedBookingColumnsKey.map (
            key => {
              return allBookingColumns[key];
            }
          );
        }



        if(res.locals.userData.userRole==='Center'){
          var sql = `SELECT center_name from centers_${orgName} WHERE email='${res.locals.userData.userEmail}'`;
          connection.query (sql, function (err, result) {
            if (!err) {
              res.locals.userData.userName = result[0]?  result[0].center_name : '';
            }
            next ();
          });
        }else{
          next ();
        }


      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  addOrganisation: function addOrganisation (req, res, next) {
    var ref = this;
    var orgData = JSON.parse (req.body.orgData);
    var orgName = orgData[0];
    new Promise ((resolve, reject) => {
      var sql = `INSERT INTO orgs (org_name, admin_name,admin_email) VALUES `;

      var val = `(`;
      orgData.forEach ((item, idx) => {
        if (typeof item === 'number') {
          val = val + item + `,`;
        } else {
          val = val + `"` + item.replace (/"/g, '"') + `",`;
        }
      });
      val = val.replace (/,$/, '') + `)`;
      sql = sql + val + `,`;
      sql = sql.replace (/,$/, '') + `;`;

      connection.query (sql, function (err, result) {
        if (!err) {
          resolve ();
        } else {
          res.statusCode = 200;
          res.setHeader ('Content-Type', 'application/json');
          res.json ({
            message: err.message,
          });
          reject ();
        }
      });
    })
      .then (() => {
        return new Promise (resolve => {
          ref.createBookingsTableIfNone (orgName, resolve);
        });
      })
      .then (() => {
        return new Promise (resolve => {
          ref.createCentersTableIfNone (orgName, resolve);
        });
      })
      .then (() => {
        ref.addUser (req, res, next);
      });
  },
  updateOrganisation: function updateOrganisation (req, res, next) {
    var orgData = typeof req.body.orgData === 'object'
      ? req.body.orgData
      : JSON.parse (req.body.orgData);
    var whereIn = Array.isArray (req.body.whereIn)
      ? req.body.whereIn
      : JSON.parse (req.body.whereIn);
    var dataKeys = Object.keys (orgData);
    var key = dataKeys[0];

    //Changing org name is not allowed
    delete orgData.org_name;

    //Check to ensure there is no privilege escalation for role

    var sql = `UPDATE orgs SET `;
    dataKeys.forEach (key => {
      var set = ` ${key}=`;
      if ('string' === typeof orgData[key]) {
        set += `'${orgData[key]}',`;
        sql = sql + set;
      } else if ('number' === typeof orgData[key]) {
        set += `${orgData[key]},`;
        sql = sql + set;
      }
    });

    sql = sql.replace (/,$/g, '') + ` WHERE ${req.body.conditionalColumn} IN `;

    if ('string' === typeof whereIn[0]) {
      sql = sql + `('${whereIn.join (`','`)}')`;
    } else if ('number' === typeof whereIn[0]) {
      sql = sql + `(${whereIn.join (`,`)})`;
    } else {
      var err = new Error ('Internal error');
      err.status = 500;
      next (err);
    }
    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },

  deleteOrganisation: function deleteOrganisation (req, res, next) {
    var ownerPass = req.body.ownerPass;
    var orgName = req.body.orgName;
    var ref = this;
    //Changing org name is not allowed
    new Promise (resolve => {
      ref.getUserByEmail (req.user.email).then (rows => {
        if (!rows.length) {
          return resolve ('User not found');
        }
        let encryptedPassword = sha256 (ownerPass + rows[0].salt).toString ();

        if (!(rows[0].password.toLowerCase () === encryptedPassword)) {
          return resolve ('Wrong Password');
        } else {
          return resolve ('success');
        }
      });
    })
      .then (message => {
        if ('success' === message) {
          var sql = `DROP TABLE custom_id_pool_${orgName}; DROP TABLE passengers_${orgName}; DROP TABLE centers_${orgName};DELETE FROM orgs WHERE org_name='${orgName}';DELETE FROM users WHERE org_name='${orgName}';`;
          connection.query (sql, function (err, result) {
            if (!err) {
              res.statusCode = 200;
              res.json ({
                message: 'success',
                data: result,
              });
            } else {
              res.statusCode = 200;
              res.json ({
                message: 'Some error occured',
              });
            }
          });
        } else if ('Wrong Password' === message) {
          res.statusCode = 200;
          res.json ({
            message: 'Wrong Password',
          });
        } else {
          res.statusCode = 403;
          res.json ({
            message: 'failed',
          });
        }
      })
      .catch (err => {
        res.statusCode = 403;
        res.json ({
          message: 'failed',
        });
      });
  },
  getOrganisations: function getOrganisations (req, res, next) {
    var sql = `SELECT org_name FROM orgs;`;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          result: JSON.stringify (result),
        });
      }
    });
  },
  getConnection: function getConnection () {
    return this.connection;
  },

  insertBookings: function insertBookings (req, res, next) {
    var orgName = req.body.orgName;
    var ref = this;
    var sql = `INSERT INTO passengers_${orgName} (${res.locals.userData.allowedBookingColumnsKey.join (',')}) VALUES `;
    var allBookingColumns = Object.keys (this.getBookingTableColumns ());
    var passengers = JSON.parse (req.body.passengers);
    var orgName = req.body.orgName;

    passengers.forEach ((row, passengerIdx) => {
      if (row.length !== res.locals.userData.allowedBookingColumnsKey.length) {
        row = row.filter ((val, idx) =>
          res.locals.userData.allowedBookingColumnsKey.includes (
            allBookingColumns[idx]
          )
        );
      }
      var val = `(`;
      row.forEach ((item, idx) => {
        if (typeof item === 'number' || item === null) {
          val = val + item + `,`;
        } else {
          val = val + `"` + item.replace (/"/g, '"') + `",`;
        }
      });
      val = val.replace (/,$/, '') + `)`;
      sql = sql + val + `,`;

      passengers[passengerIdx] = row;
    });
    sql = sql.replace (/,$/, '') + `;`;

    connection.query (sql, function (err, result) {
      if (!err) {
        //Delete locked custom ids.
        var sqlDel = `DELETE FROM custom_id_pool_${orgName} WHERE id IN (${passengers
          .map (row => parseInt (row[0].slice (1)))
          .join (',')})`;
        connection.query (sqlDel);

        if (res.locals.userData.bookingAutoNotification) {
          //Send emails.
          passengers = passengers.map (passenger => {
            var passengerObject = {};
            passenger.forEach ((field, idx) => {
              passengerObject[
                res.locals.userData.allowedBookingColumnsKey[idx]
              ] = field;
            });
            return passengerObject;
          });
          ref.sendBookingCreatedMail (req, res, passengers);
        }

        //Response.
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          id: result.insertId,
        });
      } else {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: err.message,
        });
      }
    });
  },
  sendBookingCreatedMail: function sendBookingCreatedMail (
    req,
    res,
    passengers
  ) {
    var sql = `SELECT * FROM centers_${req.body.orgName} WHERE 1 ORDER BY id DESC LIMIT 100`;
    var ref = this;
    connection.query (sql, function (err, result) {
      if (!err) {
        var centers = result.map ((center, idx) => {
          return `${idx + 1}. ${center.center_name}, Address: ${center.address}, Phone: ${center.phone}`;
        });
        if (res.locals.userData.bookingAutoNotification) {
          passengers.forEach (passenger => {
            mailer.sendBookingCreated (
              req,
              res,
              passenger,
              centers,
              ref.getBookingTableColumns ()
            );
          });
        }
      }
    });
  },
  insertCenters: function insertCenters (req, res, next) {
    var orgName = req.body.orgName;
    var sql = `INSERT INTO centers_${orgName} (center_name, concerned_person ,phone , email, timings ,address, google_map) VALUES `;

    var centers = JSON.parse (req.body.centers);
    centers.forEach (row => {
      var val = `(`;
      row.forEach ((item, idx) => {
        if (typeof item === 'number') {
          val = val + item + `,`;
        } else {
          val = val + `"` + item.replace (/"/g, '"') + `",`;
        }
      });
      val = val.replace (/,$/, '') + `)`;
      sql = sql + val + `,`;
    });
    sql = sql.replace (/,$/, '') + `;`;
    var ref = this;
    connection.query (sql, function (err, result) {
      if (!err) {
        var triggerSql = `UPDATE centers_${orgName}  SET center_id =  (CONCAT('C', SUBSTRING(CAST((id + 10000) AS CHAR), 2))) WHERE 1;`;
        connection.query (triggerSql, function (err, result) {
          ref.createUserAccountsForcenters (centers, req, res);
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  insertUsers: function insertUsers (users, res) {
    var sql = `INSERT INTO users (email, name , password , salt, date_created ,role, permissions,assigned_location, status, activation_token,org_name) VALUES `;

    users.forEach (row => {
      var val = `(`;
      row.forEach ((item, idx) => {
        if (typeof item === 'number') {
          val = val + item + `,`;
        } else {
          val = val + `'` + item + `',`;
        }
      });
      val = val.replace (/,$/, '') + `)`;
      sql = sql + val + `,`;
    });
    sql = sql.replace (/,$/, '') + `;`;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.json ({
          message: 'success',
        });
      } else {
        res.statusCode = 200;
        res.json ({
          message: err.message,
        });
      }
    });
  },
  getPassengers: function getPassengers (req, res, next) {
    var sql =
      'SELECT * FROM passengers WHERE 1 ORDER BY id DESC LIMIT ' +
      req.query.passengersCount;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
    var err = new Error ('Internal error');
    err.status = 500;
    next (err);
  },
  getCenters: function getCenters (req, res, next) {
    var sql =
      'SELECT * FROM centers WHERE 1 ORDER BY id DESC LIMIT ' +
      req.query.centersCount;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
    var err = new Error ('Internal error');
    err.status = 500;
    next (err);
  },
  deleteBookings: function deleteBookings (req, res, next) {
    var orgName = req.body.orgName;
    var sql = `DELETE FROM passengers_${orgName} WHERE id IN (${JSON.parse (req.body.passengerIds).join (',')})`;

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  deleteCenters: function deleteCenters (req, res, next) {
    var orgName = req.body.orgName;

    var sql = `DELETE FROM centers_${orgName} WHERE id IN (${JSON.parse (req.body.centerIds).join (',')});`;
    // sql += `DELETE FROM users WHERE email IN (${JSON.parse(
    //   req.body.email
    // ).join(',')});`;
    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },

  updateBooking: function updateBooking (req, res, next) {
    var passengersData = JSON.parse (req.body.passengersData);
    var whereIn = JSON.parse (req.body.whereIn);
    var dataKeys = Object.keys (passengersData);
    var key = dataKeys[0];
    var orgName = req.body.orgName;

    var sql = `UPDATE passengers_${orgName} SET `;
    dataKeys.forEach (key => {
      var set = ` ${key}=`;
      if ('string' === typeof passengersData[key]) {
        set += `'${passengersData[key]}',`;
        sql = sql + set;
      } else if ('number' === typeof passengersData[key]) {
        set += `${passengersData[key]},`;
        sql = sql + set;
      }
    });
    sql = sql.replace (/,$/g, '') + ` WHERE ${req.body.conditionalColumn} IN `;

    if ('string' === typeof whereIn[0]) {
      sql = sql + `('${whereIn.join (`','`)}');`;
    } else if ('number' === typeof whereIn[0]) {
      sql = sql + `(${whereIn.join (`,`)});`;
    } else {
      var err = new Error ('Internal error');
      err.status = 500;
      next (err);
    }

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  updateBookingStatus: function updateBookingStatus (req, res, next) {
    var ref = this;
    var passengersData = JSON.parse (req.body.passengersData);
    if (Object.keys (passengersData).length === 1 && passengersData.status) {
      if (req.user.role === 'Center') {
        var centerEmail = req.user.email;
        var sql = `SELECT * FROM centers_${req.body.orgName} WHERE email='${centerEmail}'`;
        connection.query (sql, function (err, results) {
          if (!err) {
            passengersData.center_name = results[0].center_name;
            req.body.passengersData = JSON.stringify (passengersData);
            ref.updateBooking (req, res, next);
          } else {
            res.statusCode = 403;
            res.json ({
              message: 'failed',
            });
          }
        });
      } else {
        this.updateBooking (req, res, next);
      }  
    } else {
      res.statusCode = 403;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'failed',
      });
    }
  },
  updateCenter: function updateCenter (req, res, next) {
    var orgName = req.body.orgName;

    var centerData = typeof req.body.centerData === 'object'
      ? req.body.centerData
      : JSON.parse (req.body.centerData);
    var whereIn = Array.isArray (req.body.whereIn)
      ? req.body.whereIn
      : JSON.parse (req.body.whereIn);
    var dataKeys = Object.keys (centerData);
    var key = dataKeys[0];

    var sql = `UPDATE centers_${orgName} SET`;
    dataKeys.forEach (key => {
      var set = ` ${key}=`;
      if ('string' === typeof centerData[key]) {
        set += `'${centerData[key]}',`;
        sql = sql + set;
      } else if ('number' === typeof centerData[key]) {
        set += `${centerData[key]},`;
        sql = sql + set;
      }
    });
    sql = sql.replace (/,$/g, '') + ` WHERE ${req.body.conditionalColumn} IN `;

    if ('string' === typeof whereIn[0]) {
      sql = sql + `('${whereIn.join (`','`)}');`;
    } else if ('number' === typeof whereIn[0]) {
      sql = sql + `(${whereIn.join (`,`)});`;
    } else {
      var err = new Error ('Internal error');
      err.status = 500;
      next (err);
    }

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  updateUser: function updateUser (req, res, next) {
    var userData = typeof req.body.userData === 'object'
      ? req.body.userData
      : JSON.parse (req.body.userData);
    var whereIn = Array.isArray (req.body.whereIn)
      ? req.body.whereIn
      : JSON.parse (req.body.whereIn);
    var dataKeys = Object.keys (userData);
    var key = dataKeys[0];

    //Check to ensure there is no privilege escalation for role
    if (!res.locals.accessibleRolesInUsersTable ().includes (userData.role)) {
      res.statusCode = 403;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'failed',
      });

      return;
    }

    var sql = `UPDATE users SET ${key}=`;
    dataKeys.forEach (key => {
      var set = ` ${key}=`;
      if ('string' === typeof userData[key]) {
        set += `'${userData[key]}',`;
        sql = sql + set;
      } else if ('number' === typeof userData[key]) {
        set += `${userData[key]},`;
        sql = sql + set;
      }
    });

    sql = sql.replace (/,$/g, '') + ` WHERE ${req.body.conditionalColumn} IN `;

    if ('string' === typeof whereIn[0]) {
      sql = sql + `('${whereIn.join (`','`)}')`;
    } else if ('number' === typeof whereIn[0]) {
      sql = sql + `(${whereIn.join (`,`)})`;
    } else {
      var err = new Error ('Internal error');
      err.status = 500;
      next (err);
    }
    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  passengersDatatable: function passengersDatatable (req, res, next) {
    var iDisplayStart = parseInt (req.body.start);
    var iDisplayLength = parseInt (req.body.length);
    var orgName = req.body.orgName;

    if (orgName === 'All') {
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'success',
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      });
      return;
    }
    var aColumns = [
      'id',
      'custom_id',
      'ticket',
      'name',
      'dob',
      'service',
      'departure',
      'phone',
      'email',
      'nationality',
      'passport_id',
      'passport_expiry',
      'booking_agent',
      'booking_date',
      'status',
      'lpo_number',
      'invoice',
      'center_name',
      'fulfillment_date',
    ];
    aColumns = [
      'id',
      ...aColumns.filter (key =>
        res.locals.userData.allowedBookingColumnsKey.includes (key)
      ),
    ];

    var sTable = `passengers_${orgName}`;
    var sIndexColumn = 'id';

    /*
     * Paging
     */
    var sLimit = '';
    if (iDisplayStart && iDisplayLength && iDisplayLength != -1) {
      sLimit = `LIMIT  ${iDisplayStart}, ${iDisplayLength}`;
    }

    /*
     * Ordering
     */
    var sOrder = '';
    var orderBy = req.body[`order[0][column]`];
    var columnName = req.body[`columns[${orderBy}][data]`];
    var orderDir = req.body[`order[0][dir]`];
    if (orderBy) {
      sOrder = `ORDER BY  ${columnName} ${orderDir}`;
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */
    var sWhere = '';
    var searchTerm = req.body.search.value;
    if (searchTerm) {
      sWhere = 'WHERE (';
      for (let i = 0; i < aColumns.length; i++) {
        sWhere += ` ${aColumns[i]}  LIKE '%${searchTerm}%' OR `;
      }
      sWhere = sWhere.slice (0, -3);
      sWhere += ')';
      if (req.user.role === 'Agent') {
        sWhere += " AND booking_agent='" + req.user.email + "'";
      }else if (req.user.role === 'Center') {
        sWhere += 'AND (center_name="'+res.locals.userData.userName+'")'; 
      } 
    } else if (req.user.role === 'Agent') {
      sWhere += "WHERE booking_agent='" + req.user.email + "'";
    } else if (req.user.role === 'Center') {
      sWhere += 'WHERE (center_name="'+res.locals.userData.userName+'")'; 
    } 
 
    if(sWhere.length>1){
      sWhere +=` AND (booking_date BETWEEN ${req.body.startDate} AND ${req.body.endDate})`;
    }else{
      sWhere =`WHERE (booking_date BETWEEN ${req.body.startDate} AND ${req.body.endDate})`;
    }

    /*
     * SQL queries
     * Get data to display
     */
    var sColumns = aColumns.join (', ');
    var sQueryAll = `SELECT  ${sColumns} FROM   ${sTable} ${sWhere} ${sOrder}`;
    /* Data set length after filtering */

    var queryTotal = `SELECT * FROM   ${sTable} WHERE 1`;
    connection.query (queryTotal, function (err, result) {
      if (!err) {
        var total = result.length;

        connection.query (sQueryAll, function (err, result) {
          if (!err) {
            res.statusCode = 200;
            res.setHeader ('Content-Type', 'application/json');
            var data = result
              .slice (iDisplayStart, iDisplayStart + iDisplayLength)
              .map (row => {
                Object.keys (row).map (item => {
                  var dates = [
                    'dob',
                    'departure',
                    'passport_expiry',
                    'booking_date',
                    'fulfillment_date',
                  ];
                  if (dates.includes (item)) {
                    row[item] = new Date (row[item] * 1000).toLocaleDateString (
                      'en-US'
                    );
                  }
                  if (row[item] === '1/1/1970') {
                    row[item] = '';
                  }
                });
                return row;
              });
            res.json ({
              message: 'success',
              recordsTotal: total,
              recordsFiltered: result.length,
              data: data,
            });
          } else {
            res.statusCode = 403;
            res.setHeader ('Content-Type', 'application/json');
            res.json ({
              message: 'failed',
            });
          }
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  centersDatatable: function centersDatatable (req, res, next) {
    var iDisplayStart = parseInt (req.body.start);
    var iDisplayLength = parseInt (req.body.length);

    var orgName = req.body.orgName;

    if (orgName === 'All') {
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'success',
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
      });
      return;
    }

    var aColumns = [
      'id',
      'center_id',
      'center_name',
      'concerned_person',
      'phone',
      'timings',
      'phone',
      'address',
      'google_map',
    ];

    var sTable = `centers_${orgName}`;
    var sIndexColumn = 'id';

    /*
     * Paging
     */
    var sLimit = '';
    if (iDisplayStart && iDisplayLength && iDisplayLength != -1) {
      sLimit = `LIMIT  ${iDisplayStart}, ${iDisplayLength}`;
    }

    /*
     * Ordering
     */
    var sOrder = '';
    var orderBy = req.body[`order[0][column]`];
    var columnName = req.body[`columns[${orderBy}][data]`];
    var orderDir = req.body[`order[0][dir]`];
    if (orderBy) {
      sOrder = `ORDER BY  ${columnName} ${orderDir}`;
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */
    var sWhere = '';
    var searchTerm = req.body.search.value;
    if (searchTerm) {
      sWhere = 'WHERE (';
      for (let i = 0; i < aColumns.length; i++) {
        sWhere += ` ${aColumns[i]}  LIKE '%${searchTerm}%' OR `;
      }
      sWhere = sWhere.slice (0, -3);
      sWhere += ')';
    }

    /*
     * SQL queries
     * Get data to display
     */

    var sQueryAll = `SELECT  * FROM   ${sTable} ${sWhere} ${sOrder}`;
    /* Data set length after filtering */

    var queryTotal = `SELECT  * FROM   ${sTable} WHERE 1`;
    connection.query (queryTotal, function (err, result) {
      if (!err) {
        var total = result.length;

        connection.query (sQueryAll, function (err, result) {
          if (!err) {
            res.statusCode = 200;
            res.setHeader ('Content-Type', 'application/json');
            var data = result.slice (
              iDisplayStart,
              iDisplayStart + iDisplayLength
            );
            res.json ({
              message: 'success',
              recordsTotal: total,
              recordsFiltered: result.length,
              data: data,
            });
          } else {
            res.statusCode = 403;
            res.setHeader ('Content-Type', 'application/json');
            res.json ({
              message: 'failed',
            });
          }
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },

  usersDatatable: function usersDatatable (req, res, next) {
    var iDisplayStart = parseInt (req.body.start);
    var iDisplayLength = parseInt (req.body.length);

    var orgName = req.body.orgName;
    var aColumns = ['id', 'email', 'name', 'role', 'permissions', 'org_name'];

    var sTable = 'users';
    var sIndexColumn = 'id';

    /*
     * Paging
     */
    var sLimit = '';
    if (iDisplayStart && iDisplayLength && iDisplayLength != -1) {
      sLimit = `LIMIT  ${iDisplayStart}, ${iDisplayLength}`;
    }

    /*
     * Ordering
     */
    var sOrder = '';
    var orderBy = req.body[`order[0][column]`];
    var columnName = req.body[`columns[${orderBy}][data]`];
    var orderDir = req.body[`order[0][dir]`];
    if (orderBy) {
      sOrder = `ORDER BY  ${columnName} ${orderDir}`;
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */
    var sWhere = '';
    var searchTerm = req.body.search.value;
    if (searchTerm) {
      sWhere = 'WHERE (';
      for (let i = 0; i < aColumns.length; i++) {
        sWhere += ` ${aColumns[i]}  LIKE '%${searchTerm}%' OR `;
      }
      sWhere = sWhere.slice (0, -3);
      sWhere += ')';
      sWhere += ` AND role NOT Like '%Center%' `;
    } else {
      sWhere = `WHERE role NOT Like '%Center%' `;
    }

    sWhere += orgName !== 'All' ? `AND org_name='${orgName}'` : ``;

    var accessibleRoles =
      `('` + res.locals.accessibleRolesInUsersTable ().join (`','`) + `')`;
    sWhere += `AND role in ${accessibleRoles}`;

    /*
     * SQL queries
     * Get data to display
     */

    var sQueryAll = `SELECT  * FROM   ${sTable} ${sWhere} ${sOrder}`;
    /* Data set length after filtering */

    var queryTotal = `SELECT  * FROM   ${sTable} WHERE org_name='${orgName}'`;
    connection.query (queryTotal, function (err, result) {
      if (!err) {
        var total = result.length;

        connection.query (sQueryAll, function (err, result) {
          if (!err) {
            res.statusCode = 200;
            res.setHeader ('Content-Type', 'application/json');
            var data = result.slice (
              iDisplayStart,
              iDisplayStart + iDisplayLength
            );

            res.json ({
              message: 'success',
              recordsTotal: total,
              recordsFiltered: result.length,
              data: data,
            });
          } else {
            res.statusCode = 403;
            res.setHeader ('Content-Type', 'application/json');
            res.json ({
              message: 'failed',
            });
          }
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },

  organisationDatatable: function organisationDatatable (req, res, next) {
    var iDisplayStart = parseInt (req.body.start);
    var iDisplayLength = parseInt (req.body.length);

    var aColumns = ['id', 'org_name', 'admin_email'];

    var sTable = 'orgs';
    var sIndexColumn = 'id';

    /*
     * Paging
     */
    var sLimit = '';
    if (iDisplayStart && iDisplayLength && iDisplayLength != -1) {
      sLimit = `LIMIT  ${iDisplayStart}, ${iDisplayLength}`;
    }

    /*
     * Ordering
     */
    var sOrder = '';
    var orderBy = req.body[`order[0][column]`];
    var columnName = req.body[`columns[${orderBy}][data]`];
    var orderDir = req.body[`order[0][dir]`];
    if (orderBy) {
      sOrder = `ORDER BY  ${columnName} ${orderDir}`;
    }

    /*
     * Filtering
     * NOTE this does not match the built-in DataTables filtering which does it
     * word by word on any field. It's possible to do here, but concerned about efficiency
     * on very large tables, and MySQL's regex functionality is very limited
     */
    var sWhere = '';
    var searchTerm = req.body.search.value;
    if (searchTerm) {
      sWhere = 'WHERE (';
      for (let i = 0; i < aColumns.length; i++) {
        sWhere += ` ${aColumns[i]}  LIKE '%${searchTerm}%' OR `;
      }
      sWhere = sWhere.slice (0, -3);
      sWhere += ')';
    }

    /*
     * SQL queries
     * Get data to display
     */

    var sQueryAll = `SELECT  * FROM   ${sTable} ${sWhere} ${sOrder}`;
    /* Data set length after filtering */

    var queryTotal = `SELECT  * FROM   ${sTable} WHERE 1`;
    connection.query (queryTotal, function (err, result) {
      if (!err) {
        var total = result.length;

        connection.query (sQueryAll, function (err, result) {
          if (!err) {
            res.statusCode = 200;
            res.setHeader ('Content-Type', 'application/json');
            var data = result.slice (
              iDisplayStart,
              iDisplayStart + iDisplayLength
            );

            res.json ({
              message: 'success',
              recordsTotal: total,
              recordsFiltered: result.length,
              data: data,
            });
          } else {
            res.statusCode = 403;
            res.setHeader ('Content-Type', 'application/json');
            res.json ({
              message: 'failed',
            });
          }
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  getUserByEmail: function getUserByEmail (email) {
    return new Promise ((resolve, reject) => {
      connection.query (
        "SELECT * FROM `users` WHERE `email` = '" + email + "'",
        function (err, rows) {
          if (!err) {
            resolve (rows);
          } else {
            reject (err);
          }
        }
      );
    });
  },
  getUserById: function getUserById (id) {
    return new Promise ((resolve, reject) => {
      connection.query (
        'SELECT * FROM `users` WHERE `id` = ' + id + '',
        function (err, rows) {
          if (!err) {
            resolve (rows);
          } else {
            reject (err);
          }
        }
      );
    });
  },

  getUserByIdAjax: function getUserByIdAjax (req, res, next) {
    var sql = `SELECT * FROM users WHERE id = "${req.body.id}" AND `;

    //Can only those roles be deleted which are
    sql +=
      '(' +
      res.locals
        .accessibleRolesInUsersTable ()
        .map (role => 'role="' + role + '"')
        .join (' OR ') +
      ');';

    connection.query (sql, function (err, rows) {
      if (!err) {
        res.statusCode = 200;
        res.json ({
          message: 'success',
          user: rows[0],
        });
      } else {
        res.statusCode = 404;
        res.json ({
          message: 'failed',
        });
      }
    });
  },

  generatePassword: function generatePassword () {
    return (
      Math.random ().toString (36).slice (2) +
      Math.random ().toString (36).slice (2)
    );
  },
  generateActivationToken: function generateActivationToken () {
    return (
      Math.random ().toString (36).slice (2) +
      Math.random ().toString (36).slice (2)
    );
  },
  hashPassword: function hashPassword (password) {
    var salt = this.generatePassword ().slice (0, 5);
    let hashedPass = sha256 (password + salt).toString ();
    return [hashedPass, salt];
  },
  createUserAccountsForcenters: function createUserAccountsForcenters (
    centers,
    req,
    res
  ) {
    var orgName = req.body.orgName;
    var users = centers.map (center => {
      var user = [];
      user[0] = center[3];
      user[1] = center[0];
      let passData = this.hashPassword (this.generatePassword ());
      user[2] = passData[0];
      user[3] = passData[1];
      user[4] = new Date ().getTime ();
      user[5] = 'Center';
      user[6] = JSON.stringify (this.roleMappings['Center']);
      user[7] = center[0];
      user[8] = '';
      user[9] = this.generateActivationToken ();
      user[10] = orgName;
      mailer.sendAccountCreated (user[0], req.hostname, user[9]);
      return user;
    });

    this.insertUsers (users, res);
  },
  changePassword: function changePassword (req, res, next) {
    var ref = this;
    this.getUserByEmail (req.body.email)
      .then (rows => {
        if (!rows.length) {
          res.statusCode = 200;
          res.setHeader ('Content-Type', 'application/json');
          res.json ({
            message: 'User not found',
          });
          return;
        } 

        if (req.body.token !== rows[0].activation_token) {
          res.statusCode = 403;
          res.setHeader ('Content-Type', 'application/json');
          res.json ({
            message: 'Access denied!',
          });
          return;
        }

        let encryptedPassword = sha256 (
          req.body.password + rows[0].salt
        ).toString ();

        var sql = `UPDATE users SET activation_token='' WHERE id=${rows[0].id}`;
        connection.query (sql);

        sql = `UPDATE users SET password='${encryptedPassword}' WHERE id=${rows[0].id}`;

        connection.query (sql, function (err, result) {
          if (!err) {
            ref.sendSuccessMessage (res);
          } else {
            ref.sendFailMessage (res);
          }
        });
      })
      .catch (err => console.log (err.message));
  },
  verifyChangePassword: function verifyChangePassword (req, res, next) {
    var ref = this;
    this.getUserByEmail (req.query.email)
      .then (rows => {
        if (!rows.length || req.query.token !== rows[0].activation_token) {
          res.redirect ('/login');
        } else {
          next ();
        }
      })
      .catch (err => console.log (err.message));
  },

  sendChangePasswordMail: function sendChangePasswordMail (req, res, next) {
    var ref = this;
    this.getUserByEmail (req.body.email)
      .then (rows => {
        if (!rows.length) {
          ref.sendFailMessage (res);
        } else {
          var actToken = this.generateActivationToken ();
          var sql = `UPDATE users SET activation_token='${actToken}' WHERE id=${rows[0].id}`;

          connection.query (sql, function (err, result) {
            if (!err) {
              mailer.sendChangePassword (
                req.body.email,
                req.hostname,
                actToken
              );
              ref.sendSuccessMessage (res);
            } else {
              ref.sendFailMessage (res);
            }
          });
        }
      })
      .catch (err => console.log (err.message));
  },
  getRoleMappings: function getRoleMappings (req, res, next) {
    var permissions = JSON.stringify (this.roleMappings[req.body.role]);
    res.statusCode = 200;
    res.setHeader ('Content-Type', 'application/json');
    res.json ({
      message: 'success',
      permissions: permissions,
    });
  },
  getRoles: function getRoles (req) {
    if (req.user.permissions.includes ('Write organisations')) {
      return ['Owner', 'Admin', 'Manager', 'Supervisor', 'Agent'];
    } else if (req.user.permissions.includes ('Write users')) {
      return ['Manager', 'Supervisor', 'Agent'];
    } else if (req.user.permissions.includes ('Write supervisors')) {
      return ['Supervisor', 'Agent'];
    } else if (req.user.permissions.includes ('Write agents')) {
      return ['Agent'];
    }
  },
  getServiceTypes: function getServiceTypes () {
    var serviceTypes = [
      'Clinic PCR testing - Basic',
      'Clinic PCR testing - Urgent',
      'Clinic PCR testing - Express',
      'Hotel PCR testing - Basic',
      'Hotel PCR testing - Urgent',
      'Hotel PCR testing - Express',
      'Home PCR testing - Basic',
    ];
    return serviceTypes;
  },
  roleMappings: {
    Owner: ['Write organisations', 'Read organisations'],
    Admin: [
      'Write booking',
      'Write centers',
      'Write users',
      'Read users',
      'Read centers',
      'Read bookings',
      'Write organisation settings',
      'Delete bookings',
      'Read stats',
      'Write settings',
    ],
    Manager: [
      'Write booking',
      'Write centers',
      'Write supervisors',
      'Write agents',
      'Read users',
      'Read centers',
      'Read bookings',
      'Read stats',
    ],
    Supervisor: [
      'Write booking',
      'Write agents',
      'Read centers',
      'Read bookings',
      'Read stats',
    ],
    Agent: [
      'Write booking',
      'Read centers',
      'Read bookings only by them',
      'Read stats',
    ],
    Center: ['Read bookings only for them', 'Change booking status'],
  },

  addBookings: function addBookings (req, res, next) {
    var now = parseInt (new Date ().getTime () / 1000);
    var passenger = JSON.parse (req.body.passengersData);
    passenger[11] = req.user.email;
    passenger[12] = now;
    //TODO: append only one value not 4.
    var passengers = JSON.stringify ([
      [...passenger, ...new Array (4).fill (null), 0], 
    ]);

    req.body.passengers = passengers;

    this.insertBookings (req, res, next);
  },
  importBookings: function importBookings (req, res, next) {
    var now = parseInt (new Date ().getTime () / 1000);
    var passenger = JSON.parse (req.body.passengersData);
    passenger[11] = req.user.email;
    passenger[12] = now;
    var passengers = JSON.stringify ([
      [...passenger, ...new Array (4).fill (''), 0],
    ]);
    req.body.passengers = passengers;

    var sql = `SELECT * FROM centers_${req.body.orgName} WHERE 1 ORDER BY id DESC LIMIT 100`;
    var ref = this;
    connection.query (sql, function (err, result) {
      if (!err) {
        var centers = result.map ((center, idx) => {
          return `${idx + 1}. ${center.center_name}, Address: ${center.address}, Phone: ${center.phone}`;
        });
        if (res.locals.userData.bookingAutoNotification) {
          mailer.sendBookingCreated (req, res, passenger, centers);
        }
        ref.insertBookings (req, res, next);
      }
    });
  },

  addUser: function addUser (req, res, next) {
    var user = JSON.parse (req.body.userData);

    var role = user[2];
    //Check if user is allowed to add this role.
    if (!res.locals.accessibleRolesInUsersTable ().includes (role)) {
      res.statusCode = 403;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'failed',
      });

      return;
    }
    var orgName = req.body.orgName;

    var userMapped = [];
    userMapped[0] = user[0];
    userMapped[1] = user[1];
    let passData = this.hashPassword (this.generatePassword ());
    userMapped[2] = passData[0];
    userMapped[3] = passData[1];
    userMapped[4] = new Date ().getTime ();
    userMapped[5] = user[2];
    userMapped[6] = user[3];
    userMapped[7] = user[4];
    userMapped[8] = '';
    userMapped[9] = this.generateActivationToken ();
    (userMapped[10] = orgName), mailer.sendAccountCreated (
      user[0],
      req.hostname,
      userMapped[9]
    );

    this.insertUsers ([userMapped], res);
  },
  deleteUsers: function deleteUsers (req, res, next) {
    var sql = `DELETE FROM users WHERE id IN (${JSON.parse (req.body.userIds).join (',')}) AND`;

    //Can only those roles be deleted which are
    sql +=
      '(' +
      res.locals
        .accessibleRolesInUsersTable ()
        .map (role => 'role="' + role + '"')
        .join (' OR ') +
      ');';

    connection.query (sql, function (err, result) {
      if (!err) {
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          data: result,
        });
      } else {
        res.statusCode = 403;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
      }
    });
  },
  getStats: function getStats (req, res, next) {
    var startTimes = JSON.parse (req.body.startTimes).map (el => parseInt (el));
    var getTablesSql = '';
    var sql = '';
    if (
      req.body.orgName === 'All' &&
      req.user.permissions.includes ('Read organisations')
    ) {
      getTablesSql = `SHOW TABLES FROM pcr WHERE Tables_in_pcr LIKE '%passengers%'`;
    } else {
      getTablesSql = `SHOW TABLES FROM pcr WHERE Tables_in_pcr LIKE '%passengers_${req.body.orgName}%'`;
    }

    connection.query (getTablesSql, function (err, results) {
      if (results.length < 1) {
        res.statusCode = 404;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'failed',
        });
        return;
      }
      results.forEach (result => {
        var tableName = result['Tables_in_pcr'];
        var sqlBookingLastMonth = `SELECT COUNT(id) from ${tableName} WHERE booking_date < ${startTimes[2]} AND booking_date >${startTimes[2] - 60 * 60 * 24 * 30};`,
          sqlBookingThisMonth = `SELECT COUNT(id) from ${tableName} WHERE booking_date > ${startTimes[2]};`,
          sqlBookingLastWeek = `SELECT COUNT(id) from ${tableName} WHERE booking_date < ${startTimes[1]} AND booking_date >${startTimes[1] - 60 * 60 * 24 * 7};`,
          sqlBookingThisWeek = `SELECT COUNT(id) from ${tableName} WHERE booking_date > ${startTimes[1]};`,
          sqlBookingLastDay = `SELECT COUNT(id) from ${tableName} WHERE booking_date < ${startTimes[0]} AND booking_date >${startTimes[0] - 60 * 60 * 24};`,
          sqlBookingToday = `SELECT COUNT(id) from ${tableName} WHERE booking_date > ${startTimes[0]};`,
          sqlAttendedLastMonth = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date < ${startTimes[2]} AND fulfillment_date >${startTimes[2] - 60 * 60 * 24 * 30};`,
          sqlAttendedThisMonth = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date > ${startTimes[2]};`,
          sqlAttendedLastWeek = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date < ${startTimes[1]} AND fulfillment_date >${startTimes[1] - 60 * 60 * 24 * 7};`,
          sqlAttendedThisWeek = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date > ${startTimes[1]};`,
          sqlAttendedLastDay = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date < ${startTimes[0]} AND fulfillment_date >${startTimes[0] - 60 * 60 * 24};`,
          sqlAttendedToday = `SELECT COUNT(id) from ${tableName} WHERE fulfillment_date > ${startTimes[0]};`;
        sql +=
          sqlBookingLastMonth +
          sqlBookingThisMonth +
          sqlBookingLastWeek +
          sqlBookingThisWeek +
          sqlBookingLastDay +
          sqlBookingToday +
          sqlAttendedLastMonth +
          sqlAttendedThisMonth +
          sqlAttendedLastWeek +
          sqlAttendedThisWeek +
          sqlAttendedLastDay +
          sqlAttendedToday;
      });

      connection.query (sql, function (error, results) {
        if (error) throw error;
        results = results.map (result => result[0]['COUNT(id)']);
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          stats: results,
        });
      });
    });
  },
  sendBookingSlip: function sendBookingSlip (req, res, next) {
    var sql = `SELECT * FROM centers_${req.body.orgName} WHERE 1 ORDER BY id DESC LIMIT 100`;
    var ref = this;
    connection.query (sql, function (err, result) {
      if (!err) {
        var centers = result.map ((center, idx) => {
          return `${idx + 1}. ${center.center_name}, Address: ${center.address}, Phone: ${center.phone}`;
        });

        mailer.sendBookingCreated (
          req,
          res,
          JSON.parse (req.body.passenger),
          centers,
          ref.getBookingTableColumns (),
          function (err) {
            if (!err) {
              res.statusCode = 200;
              res.setHeader ('Content-Type', 'application/json');
              res.json ({
                message: 'success',
              });
            } else {
              res.statusCode = 200;
              res.setHeader ('Content-Type', 'application/json');
              res.json ({
                message: 'failed',
              });
            }
          }
        );
      }
    });
  },
  selectCustomId: function selectCustomId (req, res, next) {
    var orgName = req.body.orgName;

    var sql = `SELECT COUNT(id) from custom_id_pool_${orgName} WHERE locked=false;`;
    var ref = this;
    connection.query (sql, function (error, result) {
      if (error) throw error;
      if (result[0]['COUNT(id)'] < 1000) {
        var sql1 = `INSERT INTO custom_id_pool_${orgName} (locked) VALUES (false)`;
        for (let i = 0; i < 1000; i++) {
          sql1 = sql1 + `,(false)`;
        }
        sql1 = sql1 + ';';
        connection.query (sql1, function (error, results) {
          if (error) throw error;
          ref.lockCustomId (req, res, next);
        });
      } else {
        ref.lockCustomId (req, res, next);
      }
    });
  },
  lockCustomId: function lockCustomId (req, res, next) {
    var orgName = req.body.orgName;

    var sql = `SELECT id FROM custom_id_pool_${orgName} WHERE locked=false ORDER BY id ASC LIMIT ${req.body.limit};`;
    connection.query (sql, function (error, result) {
      if (error) throw error;
      resultIds = result.map (row => {
        return row.id;
      });
      var ids = `(` + resultIds.join (',') + `)`;
      var sql = `UPDATE custom_id_pool_${orgName} set locked=true WHERE id in ${ids}`;
      connection.query (sql, function (error, result) {
        if (error) throw error;
        res.statusCode = 200;
        res.setHeader ('Content-Type', 'application/json');
        res.json ({
          message: 'success',
          ids: resultIds.map (
            id => 'B' + (parseInt (id) + 10000).toString ().slice (1)
          ),
        });
      });
    });
  },
  //TODO: The custom id might not get released if the window or session is closed abruptly.
  releaseCustomId: function releaseCustomId (req, res, next) {
    var orgName = req.body.orgName;

    var sql = `UPDATE custom_id_pool_${orgName} set locked=false WHERE id=${parseInt (req.body.id.slice (1))}`;
    connection.query (sql, function (error, result) {
      if (error) throw error;
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'success',
      });
    });
  }, 
  autoCompleteCountries: function autoCompleteCountries(req, res, next){
    var sql = `SELECT * FROM countries WHERE nationality LIKE '${req.body.country}%' ORDER BY nationality DESC LIMIT 25`;
    connection.query (sql, function (error, result) {
      if (error) throw error;
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'success',
        result:result,
      });
    }); 
  }, 
  autoCompleteCenters: function autoCompleteCenters(req, res, next){
    var orgName = req.body.orgName;
    var sql = `SELECT center_name FROM centers_${orgName} WHERE center_name LIKE '${req.body.center}%' ORDER BY center_name DESC LIMIT 25`;
    connection.query (sql, function (error, result) {
      if (error) throw error;
      res.statusCode = 200;
      res.setHeader ('Content-Type', 'application/json');
      res.json ({
        message: 'success',
        result:result,
      });
    });
  },
  sendSuccessMessage: function sendSuccessMessage (res) {
    res.statusCode = 200;
    res.setHeader ('Content-Type', 'application/json');
    res.json ({
      message: 'success',
    });
  },

  sendFailMessage: function sendFailMessage (res) {
    res.statusCode = 200;
    res.setHeader ('Content-Type', 'application/json');
    res.json ({
      message: 'failed',
    });
  },
};

exports.sqlMethods = sqlMethods;
