/* Module for authentication routes */
module.exports = function(settings) {
    var auth = {};

    var crypo = require('crypto');
    var request = require('request');
    var secrets = require('../secrets.json');
    var redis = settings.redis; /* lazy */
    
    auth.authroute = '/oauth2callback'; /* route for oauth2 redirect */

    auth.logout = function(req, res){
        req.session.destroy();
        res.send(200, 'You have been logged out.');
    };

    auth.gauth_url = 'https://accounts.google.com/o/oauth2/auth?' +
        'scope='+encodeURIComponent('profile email https://mail.google.com')+'&' +
        'state=%2Fprofile&' +
        'redirect_uri=' + encodeURIComponent(settings.host) +
        auth.authroute + '&' + 'response_type=code&' +
        'client_id=' + secrets.web.client_id + '&' +
        'approval_prompt=force&' +
        'access_type=offline';

    auth.authorize = function(req, res){
        if(req.query.code) {
            /* We have the code, now we request the token */
            request.post({
                url: 'https://accounts.google.com//o/oauth2/token',
                json: true,
                form: {
                    code: req.query.code,
                    client_id: secrets.web.client_id,
                    client_secret: secrets.web.client_secret,
                    redirect_uri: settings.host+auth.authroute,
                    grant_type: 'authorization_code'
                }
            },
            function(err, response, body) {
                if(err) {
                    console.error('error' + err + 'on google auth:\n' + body);
                    req.session.error = "There was an error logging in";
                } else {
                    req.session.error = false; /* tentative */
                    req.session.user = req.session.user || {};
                    /* parsing base64 encode JWT, format specified here:
                     *  https://developers.google.com/accounts/docs/OAuth2Login?hl=en#obtainuserinfo
                     */
                    var jwt = new Buffer(body.id_token.split('.')[1], 'base64');
                    var obj = JSON.parse(jwt.toString('utf-8'));
                    req.session.user.id = obj.sub; /* unique identifier */
                    loadUser(req.session.user.id, function(err, user) {
                        if(err || user === null) {
                            /* An error at this point most likely means
                             * the user was not in the database, so we
                             * swallow it and continue processing our
                             * new user */
                            req.session.user.email = obj.email;
                            req.session.user.refresh_token = body.refresh_token;
                            if (!body.refresh_token) {
                                /* something may have slipped through
                                 * and this might be an actual error */
                                 req.session.error = 'Not granted refresh token, for new user';
                                 console.error(req.session.error + ' ' +
                                    req.session.user.email);
                                 /* TODO handle this by adding force to gauth url
                                  * (note: handling it for now by leaving force on url )
                                  */
                            }
                            saveUser(req.session.user);
                            req.session.save();
                            loadProfile(req.session, body);
                            
                        } else {
                            var save = false; /* flag for whether we will need to save */
                            if(user.email !== obj.email) {
                                /* maybe an updated address */
                                user.email = obj.email;
                                save = true;
                            }
                            if(user.refresh_token !== body.refresh_token) {
                                user.refresh_token = body.refresh_token;
                                save = true;
                            }
                            if(save) {
                                saveUser(user);
                            }
                            req.session.user = user;
                            req.session.save();
                            if(!user.displayName || !user.imageUrl) {
                                /* then we need to fetch those */
                                loadProfile(req.session, body);
                            }
                        }
                    });
                }
            });
            /* While we are waiting on that request, set some tentative
             * booleans and kick the request over to the main page */
            req.session.authenticated = true;
            req.session.loading = true;
            req.session.error = false;
            res.redirect('/');
        }
        else if(req.param('error')) {
            req.session.error = 'There was an error authenticating: ' +
                req.param('error');
            res.redirect('/');
        }

        else {
            console.error('Unidentified request to '+auth.authroute+'\n'+req);
            res.send(400, 'Unidentified Syntax');
        }
    };

    /* Load minimal profile data that will be needed later */
    function loadProfile(session, auth) {
        request({
            url: 'https://www.googleapis.com/plus/v1/people/me?' +
                 'fields=displayName%2Cimage',
            json: true,
            headers: {
                'Authorization': (auth.token_type+' '+auth.access_token)
            }
        }, function(err, response, body) {
            var i;
            if(err) {
                /* it might be a good idea to regenerate session when
                 * session.error is set. there is currently no path to
                 * clear out an error set on a session, except logging
                 * out which may or may not be intuitive to the user
                 * Or we can leave this responsibility as it currently is
                 * to the front-end */
                session.error = 'There was an error loading the ' +
                'profile from googleapis: ' + err + ' - ' + body;
                console.error(session.error);
                session.authenticated = false;
                session.save();
            }
            else {
                /* Add the items we requested to the user */
                session.user.displayName = body.displayName;
                session.user.imageUrl = body.image.url; /* this change
                 * is important for storing the user in redis */
                session.loading = false; /* all done loading */
                session.save();
                saveUser(session.user);
            }
        });
    }

    /* Save user from session into database
     *
     * Warning, keys and values of user object will be saved as strings
     */
    function saveUser(user) {
        redis.hmset('user:'+user.id, user);
    }

    /* Load user from database into js object */
    function loadUser(id, callback) {
        redis.hgetall('user:'+id, function(err, user) {
            console.log('user '+id+' loaded');
            console.log(user);
            callback(err, user);
        });
    }

    /* Generate n random hex characters using Math.random */
    function rand_string(n) {
        if (n <= 0) {
            return '';
        }
        var rs = '';
        try {
            rs = crypto.randomBytes(Math.ceil(n/2)).toString('hex').slice(0,n);
            /* note: could do this non-blocking, but still might fail */
        }
        catch(ex) {
            /* known exception cause: depletion of entropy info */
            console.error('Exception generating random string: ' + ex);
            /* weaker random fallback */
            rs = '';
            var r = n % 8, q = (n-r)/8, i;
            for(i = 0; i < q; i++) {
                rs += Math.random().toString(16).slice(2);
            }
            if(r > 0){
                rs += Math.random().toString(16).slice(2,i);
            }
        }
        return rs;
    }
        
    return auth;
};
