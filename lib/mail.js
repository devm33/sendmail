/* Module for mail related routes */
module.exports = function(settings) {
    var maillib = {};

    /*** requires */
    var nodemailer = require('nodemailer');
    var userlib = require('./user.js')(settings);

    /*** modules variables */
    var secrets = require('../secrets.json');
    var validEmailRE = /\S+@\S+\.\S+/;
    if (!settings || !settings.redis) {
        throw new Error("util/user.js called without redis object");
    }
    var redis = settings.redis;
    var counter = 'mail_counter';

    /*** initialize module */
    /* TODO need to schedule all messages in database */
    
    

    /*** routing functions */
    maillib.schedule = function(req, res) {
        var mail = req.body;
        if(!mail) {
            res.send(400, 'No email data received (empty body)');
        }
        else {
            mail.user_id = req.session.user.id;
            mail.user = req.session.user;
            schedule(mail, function(err, msg) {
                if(err) {
                    res.status(404);
                }
                if(req.accepts('json')) {
                    res.send({'success': !err, 'message': msg});
                }
                else {
                    if(msg === 'sent') {
                        msg = 'Message sent successfully';
                    }
                    else if(msg === 'scheduled') {
                        msg = 'Message successfully scheduled';
                    }
                    res.send(msg);
                }
            });
        }
    };

    /*** private functions */

    /** Schedule: attempt to schedule an email return to the callback
     * function(err, msg) err as true with msg as string if an error
     * occurs, otherwise err will be null and message  will indicate
     * if scheduled (msg = scheduled) or sent immediately (msg = sent)
     */
    function schedule(mail, callback) {
        if(!mail) {
            callback(true, 'Empty email object');
            return;
        }
        if(!valid(mail)) {
            callback(true, 'Invalid email object');
            return;
        }
        var sec = Date.parse(mail.time);
        if(isNaN(sec) || sec - Date.now() <= 0) {
            send(mail, function(error, response) {
                if(error) {
                    callback(true, error);
                }
                else {
                    callback(null, 'sent');
                }
            });
        }
        else {
            redis.incr(counter, function(err, val) {
                if(err) {
                    callback(true, err);
                }
                else {
                    mail.id = val;
                    save(mail);
                    setTimeout(function(){send(mail);}, sec-Date.now());
                    callback(null, 'scheduled');
                }
            });
            
        }
    }

    /** Send: an email given a valid mail object or an id of a valid
     * mail object and have either user or user_id, if only user_id
     * exists user will be loaded from db.
     */
    function send(mail, callback) {
        /* Fix callback to be std.error if not given */
        if(!callback || typeof callback !== 'function') {
            callback = function(err, msg) {
                if(err) {
                    console.error(msg);
                }
                else { /* for testing; should remove */
                    console.log(msg);
                }
            };
        }
        
        /* Check if the mail parameter is a mail id and if so load it */
        if(typeof mail === 'number') {
            load(mail, function(err, msg) {
                if(err) {
                    callback(err, msg);
                }
                else {
                    send(msg, callback);
                }
            });
            return true;
        }

        /* Check for validity of message if not id */
        if(!valid(mail)){
            callback(true, 'Tried to send invalid mail');
            return false;
        }

        /* Load user and call transport */
        if(mail.user) {
            return transport(mail, mail.user, callback);
        }
        if(!mail.user_id) {
            var msg = 'Tried to send mail without user or user id';
            console.error(msg);
            console.error(mail);
            callback(true, msg);
            return false;
        }
        userlib.load(mail.user_id, function(err, user) {
            if(err) {
                var msg = 'Error loading user' + mail.user_id +
                    ' from db: ' + user;
                console.error(msg);
                callback(true, msg);
            }
            else {
                transport(mail, user, callback);
            }
        });
        return true;
    }

    /* Transport: helper function for send to do the actual sending work
     * once all of the validation and loading is done
     */
    function transport(mail, user, callback) {
        /* Open SMTP transport */
        var smtp = nodemailer.createTransport("SMTP", {
            host: "smtp.gmail.com",
            secureConnection: true,
            port: 465,
            auth: {
                XOAuth2: {
                    user: user.email,
                    clientId: secrets.web.client_id,
                    clientSecret: secrets.web.client_secret,
                    refreshToken: user.refresh_token
                }
            }
        });

        /* Set up from address with name */
        mail.from = user.displayName + ' <' + user.email + '>';

        /* Nice feature of nodemailer */
        mail.generateTextFromHTML = true;

        /* Send it and shutdown connection pool */
        smtp.sendMail(mail, function(error, response){
            callback(error, response);
            smtp.close(); /* TODO It'd be good to batch these for
            * a user if they have multiple to send at once, as
            * re-opening is costly */
            del(mail.id);
        });
        return true;
    }


    /* Validate a message object as having the necessary bits:
     *  - to : space separated list of email addresses
     *  - subject: "exists"
     *  - body: "exists"
     */
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
                validTo = validTo + c + ', ';
            }
        }
        if(!hasOne) {
            return false;
        }
        /* All checks passed, fix values as needed, and return true */
        mail.to = validTo.slice(0, -2); /* trailing space and comma */
        if(!mail.subject || typeof mail.subject !== 'string') {
            mail.subject = '';
        }
        if(!mail.body || typeof mail.body !== 'string') {
            mail.body = '';
        }
        return true;
    }

    /* private db functions */

    /* Save: mail into database
     *
     * If user exists on mail object it is removed temporary to be saved
     * and then re-added.
     * 
     * Warning, keys and values of object will be saved as
     * strings one level deep.
     */
    function save(mail) {
        var tmp_user = false;
        if(!mail.id) {
            console.error('Tried to save mail without id');
            return;
        }
        if(mail.user) {
            tmp_user = mail.user;
            delete mail.user;
        }
        redis.hmset('mail:'+mail.id, mail);
        if(tmp_user) {
            mail.user = tmp_user;
        }
        /* TODO need a mechanism to load all messages
         */
        /* TODO will need all mail for a user to be in a set for look-up
         * on user page
         */
    }

    /* Load: mail from database */
    function load(id, callback) {
        redis.hgetall('mail:'+id, function(err, mail) {
            console.log('mail '+id+' loaded');
            console.log(mail);
            callback(err, mail);
        });
    }

    /* Delete: mail from database */
    function del(id, callback) {
        redis.del('mail:'+id, function(err, mail) {
            console.log('mail '+id+' deleted');
            callback(err, mail);
        });
    }

    return maillib;
};
