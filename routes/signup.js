var express = require('express');
var router = express.Router();
var { sqlMethods } = require("../user-methods/sql-methods");

/* GET home page. */
router.get('/', sqlMethods.verifyChangePassword.bind(sqlMethods),function(req, res, next) {
  res.render('choose-pass');
});
router.post("/", (req, res, next) => {
  if(req.body.action === 'sendChangePasswordMail'){
    sqlMethods.sendChangePasswordMail(req,res,next);
  }else{
    sqlMethods.changePassword(req,res,next);
  }
});
module.exports = router;
