const checkPermissions = {
    checkOrg: function checkOrg(req,res, next) {
        var orgName=req.body.orgName;
        if (req.user.org_name === orgName || req.user.org_name === 'All') {
            next();
        } else {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                message: 'Permission denied!',
            });
        }
    },
    permissionsForAPIActions: {
        insertCenters: ['Write centers', 'Write organisations'],
        updateCenter: ['Write centers', 'Write organisations'],
        deleteCenters: ['Write centers', 'Write organisations'],
        addBookings: ['Write booking', 'Write organisations'],
        insertBookings: ['Write booking', 'Write organisations'],
        updateBooking: ['Write booking', 'Write organisations'],
        updateBookingStatus: ['Write booking', 'Write organisations','Change booking status'],
        deleteBookings: ['Delete booking', 'Write organisations'],
        sendBookingSlip:['Write booking', 'Write organisations'],
        getUserByIdAjax:[
            'Read organisations',
            'Read users',
            'Read supervisors',
            'Read managers',
            'Read agents',
        ],
        addUser: [
            'Write organisations',
            'Write users',
            'Write supervisors',
            'Write managers',
            'Write agents',
        ],
        updateUser: [
            'Write organisations',
            'Write users',
            'Write supervisors',
            'Write managers',
            'Write agents',
        ],
        deleteUsers: [
            'Write organisations',
            'Write users',
            'Write supervisors',
            'Write managers',
            'Write agents',
        ],
        addOrganisation: ['Write organisations'],
        updateOrganisation: ['Write organisations'],
        deleteOrganisation: ['Write organisations'],
        getOrganisations: ['Read organisations'],
        saveOrgSettings: ['Write organisation settings','Write organisations'],
        getOrgSettingsAjax: [],
        getRoleMappings: [],
        autoCompleteCountries: [],
        autoCompleteCenters: [],
        getStats: ['Read organisations', 'Read stats'],
        sendChangePasswordMail: [],
        selectCustomId: ['Write booking','Write organisations'],
        releaseCustomId: ['Write booking','Write organisations'],
    },
    checkApiPermissions: function checkApiPermissions(req, res, next) {
        req.user.permissions =Array.isArray(req.user.permissions) ? req.user.permissions:  JSON.parse(req.user.permissions);
        var userPermissions = req.user.permissions;
        //Any one permission will do
        if (
            this.permissionsForAPIActions[req.body.action].length < 1 ||
            this.permissionsForAPIActions[req.body.action].filter((value) =>
                userPermissions.includes(value)
            ).length > 0
        ) {
            if (
                [
                    'insertCenters',
                    'updateCenter',
                    'deleteCenters',
                    'addBookings',
                    'insertBookings',
                    'updateBooking',
                    'updateBookingStatus',
                    'deleteBookings',
                    'sendBookingSlip',
                    'getUserByIdAjax',
                    'addUser',
                    'deleteUsers',
                    'saveOrgSettings',
                    'getOrgSettingsAjax',
                    'getStats',
                    'selectCustomId',
                    'releaseCustomId',
                ].includes(req.body.action)
            ) {
                this.checkOrg(req, res,next);
            } else {
                next();
            }
        } else {
            res.statusCode = 403;
            res.setHeader('Content-Type', 'application/json');
            res.json({
                message: 'Permission denied!',
            });
        }
    },
    permissionsForViewingInfo: {
        centersAccess: ['Read organisations'],
        usersAccess: ['Read users', 'Read organisations'],
        statsAccess: ['Read organisations', 'Read stats'],
        deleteBookingAccess: ['Write organisations', 'Delete bookings'],
        statsAccess: ['Read organisations', 'Read stats'],
        bookDateFilterAccess: ['Read bookings', 'Read organisations'],
        bookDateFilterAccess: ['Read bookings', 'Read organisations'],
        selectOrganisationAccess: ['Read organisations'],
        organisationsAccess: ['Read organisations'],
        settingsAccess: ['Write organisations', 'Write settings'],
        delete: ['Write organisations', 'Write settings'],

    },
    getViewerPermissions: function getViewerPermissions(req, res, next) {
        req.user.permissions =Array.isArray(req.user.permissions) ? req.user.permissions:  JSON.parse(req.user.permissions);
        var userPermissions = req.user.permissions;
        var viewingPermissions = {};

        for (let prop in this.permissionsForViewingInfo) {
            //Any one permission will do
            if (
                this.permissionsForViewingInfo[prop].filter((value) =>
                    userPermissions.includes(value)
                ).length > 0
            ) {
                viewingPermissions[prop] = true;
            } else {
                viewingPermissions[prop] = false;
            }
        }
        res.locals.viewingPermissions = viewingPermissions;
        next();


    },
    rowAccessibilityPermissions: function rowAccessibilityPermissions(req, res, next) {
        req.user.permissions =Array.isArray(req.user.permissions) ? req.user.permissions:  JSON.parse(req.user.permissions);

        res.locals.accessibleRolesInUsersTable = function(){
            var accessibleRows = [];
            if( req.user.permissions.includes('Write users')){
                accessibleRows = ['Admin','Manager','Supervisor','Agent','Center'];
            }else if( req.user.permissions.includes('Write supervisors')){
                accessibleRows = ['Supervisor','Agent','Center'];
            }else if( req.user.permissions.includes('Write Agent')){
                accessibleRows = ['Agent'];
            }else if( req.user.permissions.includes('Write organisations')){
                accessibleRows = ['Owner','Admin','Manager','Supervisor','Agent','Center'];
            }

            return accessibleRows;
        };

        next();
    },
 
};

exports.checkPermissions = checkPermissions;
