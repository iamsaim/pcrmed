var express = require('express');
var router = express.Router();
var { checkPermissions } = require("../user-methods/check-permissions");
var { userData } = require("../user-methods/userdata");



router.get('/',checkPermissions.getViewerPermissions.bind(checkPermissions),userData.getUserData,function(req, res, next) {
  if(res.locals.viewingPermissions.usersAccess){
    res.render('users',{...res.locals.viewingPermissions,...res.locals.userData});
  }else{
    res.redirect('/');
  };
});

module.exports = router;
