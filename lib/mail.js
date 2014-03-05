/* Module for mail related routes */
var mail = {};
module.exports = mail;

/*** requires */
var nodemailer = require('nodemailer');

/*** modules variables */
var secrets = require('../secrets.json');
var validEmailRE = /\S+@\S+\.\S+/;

/*** routing functions */
mail.schedule = function(req, res) {
    var mail = req.body;
    if(!mail) {
        res.send(400, 'No email data received (empty body)');
    }
    else if(!valid(mail)) {
        res.send(400, 'Invalid email object');
        console.log(mail);
    }
    else {
        if(mail.time === 'now') {
            send(mail, req.session, function(error, response) {
                if(error) {
                    res.send(400, 'There was an error sending the message: '+error);
                    console.log(error);
                    console.log(response);
                }
                else {
                    res.send(200, 'Message successfully sent: '+response.message);
                }
            });
        }
        else {
            res.send(409, 'sorry, not done yet');
        }
    }
};


/*** private functions */

/** Send: an email given a valid mail object (just needs a to really)
 *  and a valid auth object
 *
 *  note: I'm not sure whether this should be exposed or not
 */
function send(mail, auth, callback) {
    if(!valid(mail)){
        console.error('Tried to send invalid mail:');
        console.error(mail);
        return false;
    }

    /* Open SMTP transport */
    var transport = nodemailer.createTransport("SMTP", {
        host: "smtp.gmail.com",
        secureConnection: true,
        port: 465,
        auth: {
            XOAuth2: {
                user: auth.profile.account_email,
                clientId: secrets.web.client_id,
                clientSecret: secrets.web.client_secret,
                refreshToken: auth.refresh_token,
                accessToken: auth.access_token
            }
        }
    });

    /* Set up from address with name */
    mail.from = auth.profile.displayName + '<' +
        auth.profile.account_email + '>';

    /* Nice feature of nodemailer */
    mail.generateTextFromHTML = true;

    /* Send it and shutdown connection pool */
    transport.sendMail(mail, callback);
    transport.close();
    return true; /* not an indication of sending success, just passing
    validation, callback(error, response) will tell you error */
};


/* Validate a message object as having the necessary bits:
 *  - to : space separated list of email addresses
 *  - subject: "exists"
 *  - body: "exists"
 *  - */
function valid(mail) {
    /* First check existence */
    if(!mail) {
        return false;
    }
    if(!mail.to || typeof mail.to !== 'string') {
        return false;
    }
    var c, hasOne = false, validTo = '';
    var toArr = mail.to.split(' ');
    for(var i = 0; i < toArr.length; i++) {
        c = toArr[i];
        if (validEmailRE.test(c)) {
            /* src: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
             * #standards */
            hasOne = true;
            validTo = validTo + c + ' ';
        }
    }
    if(!hasOne) {
        return false;
    }
    /* All checks passed, fix values as needed, and return true */
    mail.to = validTo.slice(0, -1); /* trailing space */
    if(!mail.subject || typeof mail.subject !== 'string') {
        mail.subject = '';
    }
    if(!mail.body || typeof mail.body !== 'string') {
        mail.body = '';
    }
    return true;
}