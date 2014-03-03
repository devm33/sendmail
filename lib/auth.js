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


    /* Generate n random characters from [0-9,a-z] using Math.random */
    function rand_string(n) {
        if (n <= 0) {
            return '';
        }
        return Math.floor(Math.random()*Math.pow(36,n)).toString(36);
    }
        
    return auth;
};
