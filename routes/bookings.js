var express = require('express');
var router = express.Router();
var { checkPermissions } = require("../user-methods/check-permissions");
var { userData } = require("../user-methods/userdata");

/* GET home page. */
router.get('/',checkPermissions.getViewerPermissions.bind(checkPermissions),userData.getUserData,function(req, res, next) {

  res.render('bookings',{...res.locals.viewingPermissions,...res.locals.userData});

});

module.exports = router;
