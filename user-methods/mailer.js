const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();
const {
  GMAIL_USERNAME,
  GMAIL_CLIENT_ID,
  GMAIL_CLIENT_SECRET,
  GMAIL_REFRESH_TOKEN,
  GMAIL_ACCESS_TOKEN,
  ADMIN_EMAIL,
} = process.env;

const mailer = {
  init: function init() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        type: 'OAuth2',
        user: GMAIL_USERNAME,
        clientId: GMAIL_CLIENT_ID,
        clientSecret: GMAIL_CLIENT_SECRET,
        refreshToken: GMAIL_REFRESH_TOKEN,
        accessToken: GMAIL_ACCESS_TOKEN,
      },
    });
  },
  sendAccountCreated: function sendAccountCreated(email, hostname, code) {
    hostname = hostname === 'localhost' ? 'localhost:4080' : hostname;
    var link = `http://${hostname}/signup/?token=${code}&email=${email}`;
    var mail = {
      from: 'no-reply <no-reply@247medservices.com>',
      //  to:'ankush@247medservices.com',
      to: email,
      subject: 'Account created',
      text: `Your account has been successfully created at 247medservices.com. Use the below link to activate it. \n ${link}`,
      html: `<p>Your account has been successfully created at 247medservices.com. Use the below link to activate it. <br> <a href="${link}">${link}</a></p>`,
    };

    this.sendMail(mail);
  }, 
  sendBookingCreated: function sendBookingCreated(req,res,passenger, centers, columns,callback=null) {
    var html = Buffer.from(res.locals.userData.bookingCreateEmail, 'base64').toString();
    for(key in passenger){
      var replaceValue = [
        'dob',
        'departure',
        'passport_expiry',
        'booking_date',
        'fulfillment_date',
      ].includes(key) && typeof passenger[key]==='integer'? new Date(passenger[key] * 1000).toLocaleDateString(
        'en-US'
      ) : passenger[key];
      html = html.replace(new RegExp('{{'+columns[key]+'}}','g'), replaceValue);

    }

    html =  html.replace(/{{Centers\s list}}/g,centers.join(`<br/><br/>`) );
    html =  html.replace(/{{Agent\sname}}/g,res.locals.userData.userName);

    //remove any unprocessed values
    html =  html.replace(/{{[a-zA-Z\d\s/\-\_]{1,20}}}/g,'');

   // var text = html.replace(/<[a]{}>/)
    var mail = {
      from: 'no-reply <no-reply@247medservices.com>',
      to: passenger['email'],
      subject: 'Booking created',
      // text: `Dear ${passenger['name']}

      //               Thanks for using 247medservices.com !

      //               We have successfully received your application and here is the details you submitted:
 
      //               ${Object.keys(passenger)
      //                 .map((key) => {
      //                   var field = [
      //                     'dob',
      //                     'departure',
      //                     'passport_expiry',
      //                     'booking_date',
      //                     'fulfillment_date',
      //                   ].includes(key)
      //                     ? new Date(passenger[key] * 1000).toLocaleDateString(
      //                         'en-US'
      //                       )
      //                     : passenger[key];
      //                   return columns[key] + ':' + field;
      //                 })
      //                 .join('\n')}


      //               You can visit any of the below center of your choice:

      //               ${centers.join('\n\n')}
      //               Thanks
      //               247 Med Services`,
      html
    };
    if( req.body.pdf){
      mail['attachments'] = [
        {
          filename: 'Booking slip.pdf',
          path: req.body.pdf,
          contentType: 'application/pdf',
        },
      ];
    }
    this.sendMail(mail,callback);
  },


  sendChangePassword: function sendChangePassword(email, hostname, code) {
    hostname = hostname === 'localhost' ? 'localhost:4080' : hostname;
    var link = `http://${hostname}/change-password/?token=${code}&email=${email}`;
    var mail = {
      from: 'no-reply <no-reply@247medservices.com>',
      to: email,
      subject: 'Change password',
      text: `Please follow the link to change your password. If you received this email by mistake please contact us at ${ADMIN_EMAIL}.\n ${link}`,
      html: `<p>Please follow the link to change your password. If you received this email by mistake please contact us at ${ADMIN_EMAIL}.<br> <a href="${link}">${link}</a></p>`,
    };

    this.sendMail(mail);
  },
  sendMail: function sendMail(mail, callback = null) {
    var transporter = this.transporter;
    transporter.sendMail(mail, function (err, info) {
      if (callback) {
        callback(err);
      }

      if (err) {
        console.log(err);
      } else {
        // see https://nodemailer.com/usage
        console.log('info.accepted: ' + info.accepted);
      }
      transporter.close();
    });
  },
};

module.exports = mailer;
