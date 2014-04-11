/* Module for mail related routes */
module.exports = function(settings) {
    var maillib = {};

    /*** requires */
    var nodemailer = require('nodemailer');
    var userlib = require('./user.js')(settings);
    var utillib = require('./util.js');

    /*** modules variables */
    var errlog = utillib.errlog;
    var checkcallback = utillib.checkcallback;
    var E = utillib.exists;
    var secrets = require('../secrets.json');
    var validEmailRE = /\S+@\S+\.\S+/;
    if (!settings || !settings.redis) {
        throw new Error("lib/mail.js called without redis object");
    }
    var redis = settings.redis;
    var counter = 'mail_counter';

    /*** initialize module */

    /* Load all and schedule all pending mail */
    loadAll(function(err, mail) {
        if(err) {
            errlog('Error loading all mail to init mail module: '+mail);
        }
        mail.forEach(schedule);
    });

    /*** routing functions */
    maillib.pending = function(req, res) {
        /* Return all pending mail for a user */ /* gah better name needed */
        if(!E(req, 'session.user.id')) {
            res.send(403, 'Not Authorized');
        }
        else {
            var callback = function(err, msgs) {
                if(err) {
                    var msg = 'Error loading mail for user:'+msgs;
                    errlog(msg);
                    res.send(500, {'success': false, 'message':msg});
                }
                else {
                    res.send(msgs);
                }
            };
            loadAllForUser(req.session.user.id, function(err, msgs) {
                if(err) {
                    callback(err, msgs);
                }
                else {
                    multiLoad(msgs, callback);
                }
            });
        }
    };
    
    maillib.schedule = function(req, res) {
        var mail = req.body;
        if(!mail) {
            res.send(400, 'No email data received (empty body)');
        }
        else {
            if(mail.key){
                 userlib.loadUserWithKey(mail.key, function(err, user) {
                    if(err) {
                        var msg = 'Error loading user key' + mail.key + ' from db';
                        errlog(msg);
                        res.status(404);
                        if(req.accepts('json')) {
                            res.send({'success': false, 'message': msg});
                        }
                        else{
                            res.send(msg);
                        }
                    }
                    else {
                        mail.user_id = user.id;
                        mail.user = user;
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
                 });
            }
            else{
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
        }
    };

    /*** private functions */

    /** Schedule: attempt to schedule an email return to the callback
     * function(err, msg) err as true with msg as string if an error
     * occurs, otherwise err will be null and message  will indicate
     * if scheduled (msg = scheduled) or sent immediately (msg = sent)
     */
    function schedule(mail, callback) {
        callback = checkcallback(callback);

        /* Validate mail parameter */
        if(!mail) {
            callback(true, 'Empty email object');
            return;
        }
        if(!isNaN(mail)) {
            load(mail, function(err, msg) {
                if(err) {
                    callback(err, msg);
                }
                else {
                    schedule(msg, callback);
                }
            });
            return true;
        }
        if(!valid(mail)) {
            callback(true, 'Invalid email object');
            return;
        }

        /* Either send or schedule mail */
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
        else if(mail.id) {
            setTimeout(function(){send(mail);}, sec-Date.now());
            callback(null, 'scheduled');
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
        callback = checkcallback(callback);

        /* Check if the mail parameter is a mail id and if so load it */
        if(!isNaN(mail)) {
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
            errlog(msg);
            errlog(mail);
            callback(true, msg);
            return false;
        }
        userlib.load(mail.user_id, function(err, user) {
            if(err) {
                var msg = 'Error loading user' + mail.user_id +
                    ' from db: ' + user;
                errlog(msg);
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
            if(mail.id) {
                /* delete message from db, wont have an id if
                 * not in db (e.g. sent immediately */
                del(mail);
            }
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
        /* Error check input */
        if(!mail.id) {
            errlog('Tried to save mail without id');
            return;
        }
        if(!mail.user_id && !mail.user) {
            errlog('Tried to save mail without user id');
            return;
        }

        /* Handle case of user property by removing temporarily */
        var tmp_user = false;
        if(mail.user) {
            tmp_user = mail.user;
            delete mail.user;
            mail.user_id = tmp_user.id; /* in case it's not there */
        }

        /* Add entirety of mail object under "mail:id" hashmap */
        redis.hmset('mail:'+mail.id, mail);

        /* Add mail:id to a set under mail:user_id to look up all mail
         * for a given user */
        redis.sadd('mail:user:'+mail.user_id, mail.id);

        /* Add mail:id to a set under mail to look up all mail */
        redis.sadd('mail', mail.id);

        /* Add user back to object if removed */
        if(tmp_user) {
            mail.user = tmp_user;
        }
    }

    /* Load: mail from database */
    function load(id, callback) {
        redis.hgetall('mail:'+id, checkcallback(callback));
    }

    /* Load all the mail for a given user id */
    function loadAllForUser(user_id, callback) {
        redis.smembers('mail:user:'+user_id, checkcallback(callback));
    }

    /* Load all pending mail */
    function loadAll(callback) {
        redis.smembers('mail', checkcallback(callback));
    }

    /* Multi-load mail: given an array of mail ids returns an array of
     * fully loaded mail objects */
    function multiLoad(ids, callback) {
        if(!Array.isArray(ids)) {
            callback(true, 'Multi-load not passed array of ids');
            return;
        }
        var multi = redis.multi();
        for(var i = 0; i < ids.length; i++) {
            multi.hgetall('mail:'+ids[i]);
        }
        multi.exec(checkcallback(callback));
    }

    /* Delete: mail from database */
    function del(mail) {
        /* Check input */
        if(!mail.id) {
            errlog('Tried to delete message without id');
            return;
        }
        if(!mail.user_id) {
            errlog('Tried to delete message without user id');
            return;
        }

        /* Delete from relevant sets */
        redis.del('mail:'+mail.id);
        redis.srem('mail', mail.id);
        redis.srem('mail:user:'+mail.user_id, mail.id);
    }

    return maillib;
};
