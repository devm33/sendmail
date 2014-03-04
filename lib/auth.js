/* Module for authentication routes */
module.exports = function(host) {
    var auth = {};

    var request = require('request');
    var secrets = require('../secrets.json');
    
    auth.authroute = '/oauth2callback'; // route for oauth2 redirect

    auth.logout = function(req, res){
        req.session.destroy();
        res.send(200, 'You have been logged out.');
    };

    auth.gauth_url = 'https://accounts.google.com/o/oauth2/auth?' +
        'scope=email%20profile&' +
        'state=%2Fprofile&' +
        'redirect_uri=' + encodeURIComponent(host) + auth.authroute +
        '&' + 'response_type=code&' +
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
                    redirect_uri: host+auth.authroute,
                    grant_type: 'authorization_code'
                }
            },
            function(err, response, body) {
                if(err) {
                    console.error('error' + err + 'on google auth:\n' + body);
                    req.session.error = "There was an error logging in";
                } else {
                    req.session.access_token = body.access_token;
                    req.session.id_token = body.id_token;
                    req.session.token_type = body.token_type;
                    req.session.refresh_token = body.refresh_token;
                    req.session.error = false;
                    req.session.save();
                    loadProfile(req.session);
                }
            });
            /* while we are waiting for that to come back, go ahead
             * and name this session and send the main page that will
             * callback for more data */
            req.session.name = rand_string(10);
            res.redirect('/');
        }
        else {
            console.error('Unidentified request to '+auth.authroute+'\n'+req);
            res.send(400, 'Unidentified Syntax');
        }
    };

    /* Load minimal profile data that will be needed later */
    function loadProfile(session) {
        request({
            url: 'https://www.googleapis.com/plus/v1/people/me?' +
                 'fields=displayName%2Cemails%2Cimage',
            json: true,
            headers: {
                'Authorization': (session.token_type+' '+session.access_token)
            }
        }, function(err, response, body) {
            var i;
            if(err) {
                /* it might be a good idea to regenerate session when
                 * session.error is set. there is currently no path to
                 * clear out an error set on a session, except logging
                 * out which may or may not be intuitive to the user */
                session.error = 'There was an error loading the ' +
                'profile from googleapis: ' + err + ' - ' + body;
                console.error(session.error);
                session.save();
            }
            else {
                /* Save the parts of the profile we care about */
                session.profile = body;
                var i = 0;
                while(body.emails[i] && body.emails[i].type !== 'account') {
                    i++;
                }
                if(body.emails[i]) {
                    session.account_email = body.emails[i].value;
                }
                else if(body.emails.length > 0) {
                    /* fall back - might not be ideal behavior */
                    session.account_email = body.emails[0].value;
                }
                else {
                    session.error = 'There were no email addresses associated with your account';
                }  
                session.save();
            }
        });
    }

    /* Generate n random characters from [0-9,a-z] using Math.random */
    function rand_string(n) {
        if (n <= 0) {
            return '';
        }
        return Math.floor(Math.random()*Math.pow(36,n)).toString(36);
    }
        
    return auth;
};
