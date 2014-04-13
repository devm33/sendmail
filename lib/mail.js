/* Module for mail related routes */
module.exports = function(settings) {
    var maillib = {};

    /*** requires */
    var nodemailer = require('nodemailer');
    var userlib = require('./user.js')(settings);
    var utillib = require('./util.js');
    var Imap = require('imap');
    var xoauth2 = require('xoauth2');

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
    var timeout_pool = {}; /* map of mail.id's to current timeout objects */

    /*** initialize module */

    /* Load all and schedule all pending mail */
    loadAll(function(err, mail) {
        if(err) {
            errlog('Error loading all mail to init mail module: '+mail);
        }
        mail.forEach(schedule);
    });

    /*** routing functions */
    maillib.del = function(req, res) {
        /* Delete a message given a properly authenticated and
         * associated session  */
        if(!E(req, 'session.user.id')) {
            res.send(403, 'Not Authorized');
        }
        var mail_id = req.param('id');
        redis.hmget('mail:'+mail_id, 'user_id', function(err, id) {
            if(err) {
                res.send(404, {
                    success: false,
                    message: ('Error finding requested mail: '+id)
                });
            }
            else if(id === req.session.user.id) {
                res.send(403, {
                    success: false,
                    message: 'This is not your mail'
                });
            }
            else {
                del({'id':mail_id, 'user_id':id});
                res.send({'success': true});
            }
        });
    };

    maillib.pending = function(req, res) { /* TODO better name needed */
        /* Return all pending mail for a user */
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
                        utillib.send(req, res, true, msg, 500);
                    }
                    else {
                        mail.user_id = user.id;
                        mail.user = user;
                        schedule(mail, function(err, msg) {
                            utillib.send(req, res, err, msg, 500);
                        });
                    }
                 });
            }
            else{
                mail.user_id = req.session.user.id;
                mail.user = req.session.user;
                schedule(mail, function(err, msg) {
                    utillib.send(req, res, err, msg, 500);
                });
            }
        }
    };

    maillib.remind = function(req, res) {
        var reminder = req.body;
        if(!reminder) {
            res.send(400, 'No remind data received (empty body)');
        }
        else {
            if(reminder.key){
                 userlib.loadUserWithKey(reminder.key, function(err, user) {
                    if(err) {
                        var msg = 'Error loading user key' + reminder.key + ' from db';
                        errlog(msg);
                        utillib.send(req, res, err, msg, 500);
                    }
                    else {
                        reminder.user_id = user.id;
                        reminder.user = user;
                        reminder.isReminder = true;
                        schedule(reminder, function(err, msg) {
                            utillib.send(req, res, err, msg, 500);
                        });
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
            /* Time is invalid or in the past: take action now */
            if(mail.isReminder){
                remind(mail, function(error, response){
                    if(error) {
                        callback(true, error);
                    }
                    else {
                        callback(null, 'sent');
                    }
                });
            }
            else{
                send(mail, function(error, response) {
                    if(error) {
                        callback(true, error);
                    }
                    else {
                        callback(null, 'sent');
                    }
                });
            }
            /* TODO if this is an edit then potential race condition here */
        }
        else if(mail.id) {
            /* This is an update - clear old time and schedule new one */
            save(mail);
            if(timeout_pool[mail.id]) { /* this should always be there, but just in case */
                clearTimeout(timeout_pool[mail.id]);
            }
            if(mail.isReminder){
                timeout_pool[mail.id] = setTimeout(function(){remind(mail.id);}, sec-Date.now());
            }
            else{
                timeout_pool[mail.id] = setTimeout(function(){send(mail.id);}, sec-Date.now());
            }
            callback(null, 'scheduled');
        }
        else {
            /* If no id supplied have to assume it is a new message,
             * so grab it a fresh id and queue it to be mailed */
            redis.incr(counter, function(err, val) {
                if(err) {
                    callback(true, err);
                }
                else {
                    mail.id = val;
                    save(mail);
                    if(mail.isReminder){
                        timeout_pool[mail.id] = setTimeout(function(){remind(mail.id);}, sec-Date.now());
                    }
                    else{
                        timeout_pool[mail.id] = setTimeout(function(){send(mail.id);}, sec-Date.now());
                    }
                    callback(null, 'scheduled');
                }
            });
            
        }
    }

    /** Send: an email given a valid mail object or an id of a valid
     * mail object and have either user or user_id, if only user_id
     * exists user will be loaded from db.
     *
     * Note: all delayed calls to this function should use send(id)
     * rather than send(mail) to ensure the message data is still
     * up to date (or deleted if the case may be) when the message is
     * eventually sent.
     */
    function send(mail, callback) {
        callback = checkcallback(callback);

        /* Check if the mail parameter is a mail id and if so load it */
        if(!isNaN(mail)) {
            load(mail, function(err, msg) {
                if(err) {
                    /* Message may have been deleted */
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
        if(mail.isReminder){
            /* if the mail is a reminder, this is all the checks we need to do */
            return true;
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

    /* Remind - Marks specified reminder object (or reminder corresponding to passed id) as unread and moves it to inbox */
    function remind(reminder, callback){
        callback = checkcallback(callback);
        if(!isNaN(reminder)) {
            load(reminder, function(err, msg) {
                if(err) {
                    /* Message may have been deleted */
                    callback(err, msg);
                }
                else {
                    remind(msg, callback);
                }
            });
            return;
        }
        if(reminder.user) {
            return imapRemind(reminder, reminder.user, callback);
        }
        if(!reminder.user_id) {
            var msg = 'Tried to send reminder without user or user id';
            errlog(msg);
            errlog(mail);
            callback(true, msg);
            return false;
        }
        userlib.load(reminder.user_id, function(err, user) {
            if(err) {
                var msg = 'Error loading user' + reminder.user_id +
                    ' from db: ' + user;
                errlog(msg);
                callback(true, msg);
            }
            else {
                imapRemind(reminder, user, callback);
            }
        });
    }

    /* Helper that does the actual reminding */
    function imapRemind(reminder, user, callback){
        var xoauth2gen = xoauth2.createXOAuth2Generator({
            user: user.email,
            clientId: secrets.web.client_id,
            clientSecret: secrets.web.client_secret,
            refreshToken: user.refresh_token
        });
        xoauth2gen.getToken(function(err, token){
            if(err){
                errlog(err);
                callback(true, err);
                return;
            }
            var imap = new Imap({
                xoauth2: token, 
                host: "imap.gmail.com", 
                port: 993, 
                tls: true
            });
            imap.once('ready', function(){
                imap.openBox("[Gmail]/All Mail", false, function(err, mailbox){
                    imap.search([['SUBJECT', reminder.subject]], function(err, results){
                        if(err){
                            errlog(err);
                            callback(true, err);
                        }
                        imap.delFlags(results, "SEEN", function(err){
                            if(err){
                                errlog(err);
                                callback(true, err);
                            }
                            imap.move(results, "INBOX", function(err){
                                if(err){
                                    errlog(err);
                                    callback(true, err);
                                };
                                imap.end();
                            });
                        });
                    });
                });
            });
            imap.once('error', function(err){
                errlog(err);
                //seem to get a lot of connection drops from google, so surpressing this error for now and just trying again
                //TODO figure out how to handle this
                imapRemind(reminder, user, callback);
            });
            imap.once('end', function(){
                callback(false, "reminded");
                if(reminder.id) {
                    /* delete message from db, wont have an id if
                    * not in db (e.g. sent immediately */
                    del(reminder);
                }
            });
            imap.connect();
        });
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

        /* Cancel timeout an delete from timeout_pool */
        if(timeout_pool[mail.id]) {
            clearTimeout(timeout_pool[mail.id]);
            delete timeout_pool[mail.id];
        }

        /* Delete from relevant sets */
        redis.del('mail:'+mail.id);
        redis.srem('mail', mail.id);
        redis.srem('mail:user:'+mail.user_id, mail.id);
    }

    return maillib;
};
