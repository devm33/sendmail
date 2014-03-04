/* Module for mail related routes */
var mail = {};
module.exports = mail;

var nodemailer = require("nodemailer");

mail.sendNow = function(req, res) {

};

mail.send = function(mail, auth) {
    if(!valid(mail)){
        return false;
    }
    var transport = nodemailer.createTransport("SMTP", {
        host: "smtp.gmail.com",
        secureConnection: true,
        port: 465,
        auth: {
            XOAuth2: {
                user: auth.profile.emails[0].value,
                clientId: "8819981768.apps.googleusercontent.com",
                clientSecret: "{client_secret}",
                refreshToken: "1/xEoDL4iW3cxlI7yDbSRFYNG01kVKM2C-259HOF2aQbI",
                accessToken: "vF9dft4qmTc2Nvb3RlckBhdHRhdmlzdGEuY29tCg=="
            }
        }
    }); /* TODO */
    return true;
};


/* Validate a message object as having the necessary bits:
 *  - to : [at least one valid email address] must be array
 *  - subject: "exists"
 *  - body: "exists"
 *  - */
function valid(mail) {
    /* First check values */
    if(!mail) {
        return false;
    }
    if(!mail.to || !mail.to.length) {
        return false;
    }
    var c, has_one = false, keeps = [];
    for(var i = 0; i < mail.to.length; i++) {
        c = mail.to[i];
        if (typeof c === 'string' && (/\S+@\S+/).test(c)) {
            /* src: http://stackoverflow.com/questions/46155/validate-email-address-in-javascript
             * #standards */
            has_one = true;
            keeps.push(c);
        }
    }
    if(!has_one) {
        return false;
    }
    /* All checks passed, fix values as needed, and return true */
    mail.to = keeps;
    if(!mail.subject || typeof mail.subject !== 'string') {
        mail.subject = '';
    }
    if(!mail.body || typeof mail.body !== 'string') {
        mail.body = '';
    }
    return true;
}
