var express = require('express');
var router = express.Router();
var {sqlMethods} = require('../user-methods/sql-methods');
var {checkPermissions} = require('../user-methods/check-permissions');
var {userData} = require('../user-methods/userdata');

router.post(
  '/',
  checkPermissions.checkApiPermissions.bind(checkPermissions),
  checkPermissions.rowAccessibilityPermissions.bind(checkPermissions),
  userData.getUserData,
  (req, res, next) => {
    switch (req.body.action) {
      case 'insertCenters':
        sqlMethods.insertCenters(req, res, next);
        break;
      case 'updateCenter':
        sqlMethods.updateCenter(req, res, next);
        break;
      case 'deleteCenters':
        sqlMethods.deleteCenters(req, res, next);
        break;
      case 'addBookings':
        sqlMethods.addBookings(req, res, next);
        break;
      case 'insertBookings':
        sqlMethods.insertBookings(req, res, next);
        break;
      case 'updateBooking':
        sqlMethods.updateBooking(req, res, next);
        break;
      case 'updateBookingStatus':
        sqlMethods.updateBookingStatus(req, res, next);
        break;
      case 'deleteBookings':
        sqlMethods.deleteBookings(req, res, next);
        break;
      case 'sendBookingSlip':
        sqlMethods.sendBookingSlip(req, res, next);
        break;
      case 'getUserByIdAjax':
        sqlMethods.getUserByIdAjax(req, res, next);
        break;
      case 'addUser':
        sqlMethods.addUser(req, res, next);
        break;
      case 'updateUser':
        sqlMethods.updateUser(req, res, next);
        break;
      case 'deleteUsers':
        sqlMethods.deleteUsers(req, res, next);
        break;
      case 'addOrganisation':
        sqlMethods.addOrganisation(req, res, next);
        break;
      case 'updateOrganisation':
        sqlMethods.updateOrganisation(req, res, next);
        break;
      case 'deleteOrganisation':
        sqlMethods.deleteOrganisation(req, res, next);
        break;
      case 'getOrganisations':
        sqlMethods.getOrganisations(req, res, next);
        break;
      case 'saveOrgSettings':
        sqlMethods.saveOrgSettings(req, res, next);
        break;
      case 'getOrgSettingsAjax':
        sqlMethods.getOrgSettingsAjax(req, res, next);
        break;
      case 'getRoleMappings':
        sqlMethods.getRoleMappings(req, res, next);
        break;
      case 'getStats':
        sqlMethods.getStats(req, res, next);
        break;
      case 'sendChangePasswordMail':
        sqlMethods.sendChangePasswordMail(req, res, next);
        break;
      case 'selectCustomId':
        sqlMethods.selectCustomId(req, res, next);
        break;
      case 'releaseCustomId':
        sqlMethods.releaseCustomId(req, res, next);
        break;
      case 'autoCompleteCountries':
        sqlMethods.autoCompleteCountries(req, res, next);
        break;
      case 'autoCompleteCenters':
        sqlMethods.autoCompleteCenters(req, res, next);
        break;
  

      default:
        break;
    }
  }
);
router.post('/datatable/passengers', userData.getUserData, (req, res, next) => {
  sqlMethods.passengersDatatable(req, res, next);
});
router.post('/datatable/centers', userData.getUserData, (req, res, next) => {
  sqlMethods.centersDatatable(req, res, next);
});
router.post(
  '/datatable/users',
  checkPermissions.rowAccessibilityPermissions,
  userData.getUserData,
  (req, res, next) => {
    sqlMethods.usersDatatable(req, res, next);
  }
);

router.post(
  '/datatable/organisations',
  userData.getUserData,
  (req, res, next) => {
    sqlMethods.organisationDatatable(req, res, next);
  }
);

module.exports = router;
