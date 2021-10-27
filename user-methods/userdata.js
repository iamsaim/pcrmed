var { sqlMethods } = require("./sql-methods");


const userData={
    getUserData:function getUserData(req,res,next){
        res.locals.userData={
            userEmail:req.user.email,
            userName:req.user.name,
            userRole:req.user.role,
            orgName:req.user.org_name,
            allBookingColumnsKey: Object.keys(sqlMethods.getBookingTableColumns()),
            serviceTypes:sqlMethods.getServiceTypes(),
            roles:sqlMethods.getRoles(req),
            bookingTableColumnValues:Object.values(sqlMethods.getBookingTableColumns()),
            bookingTableColumnKeys:Object.keys(sqlMethods.getBookingTableColumns()),
            adminPermissions:sqlMethods.roleMappings['Admin'],
        };
       var getOrgSettings = sqlMethods.getOrgSettings.bind(sqlMethods);
       getOrgSettings(req,res,next);
    }, 

}

exports.userData = userData;
