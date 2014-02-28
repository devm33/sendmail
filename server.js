/* 
 Main server file for sendmail app
*/

/*** requires */
var express = require('express');
var request = require('request');
var utility = require('./utility.js'); /* some utility functions */

/*** global vars */
var port = process.env.PORT || 5000; // heroku port || local test port
var testing = (port == 5000); // the port tells us if we're testing
var oauth2 = 'oauth2callback'; // route for oauth2 redirect
var hostroot = 'https://sendmail4911.herokuapp.com/';
if(testing) {
    hostroot = 'http://localhost:5000/';
}
var secrets = require('./secrets.json');
var cookie_secret = secrets.cookie_pass || 'dumb pass';
var gauth_url = 'https://accounts.google.com/o/oauth2/auth?' +
    'scope=email%20profile&' +
    'state=%2Fprofile&' +
    'redirect_uri=' + encodeURIComponent(hostroot) + oauth2 + '&' +
    'response_type=code&' +
    'client_id=' + secrets.web.client_id + '&' +
    'approval_prompt=force&' +
    'access_type=offline';

/*** config */
var app = express();
app.configure(function(){
    // turn on default logging
    app.use(express.logger());

    // use ejs for templates
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');

    // serve files out of static dir
    app.use(express.static(__dirname + '/static', {maxAge: 31557600000}));

    // enable gzipping
    app.use(express.compress());

    // cookie processing for session
    app.use(express.cookieParser(cookie_secret));

    // use express's session handling for most of user management
    app.use(express.session());
});

/*** endpoints */
app.get('/', function(req, res){
    var template = 'landing';
    var opts = {'gauth_url': gauth_url, 'err': false};
    if (req.session.name) {
        if (req.session.error) {
            opts.err = "There was an error logging in";
        } else {
            template = 'main';
            opts = {'loading': (req.session.id_token === undefined)};
        }
    }
    res.render(template, opts);
});

app.get('/profile', function(req, res){
    // If authenticated returns a json object with some profile data
    var auth = req.session; //too long
    if(!auth.name) {
        res.send(403, 'Not authorized');
    } else if(!auth.id_token) {
        res.send(409, {'status':'not_ready'});
    } else {   
        request({
            url: 'https://www.googleapis.com/plus/v1/people/me',
            headers: {
                'Authorization': (auth.token_type+' '+auth.access_token)
            }
        }, function(err, response, body) {
            if(err) {
                res.status(401);
            }
            res.send(body);
        });
    }
});

app.get('/logout', function(req, res){
    req.session.destroy();
    res.send(200, 'You have been logged out.');
});

app.get('/'+oauth2, function(req, res){
    if(req.query.code) {
        /* We have the code, now we request the token */
        request.post({
            url: 'https://accounts.google.com//o/oauth2/token',
            json: true,
            form: {
                code: req.query.code,
                client_id: secrets.web.client_id,
                client_secret: secrets.web.client_secret,
                redirect_uri: hostroot+oauth2,
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
        /*, while we are waiting for that to come back, go ahead and name this
         * session and send the main page that will callback for more data */
        req.session.name = utility.rand_string(10);
        res.redirect('/');
    }
    else {
        console.error('Unidentified request to '+oauth2+'\n'+req);
        res.send(400, 'Unidentified Syntax');
    }
    /* TODO maybe, if annoying enough, all this auth stuff could be moved to
     * another file */
});

/* Simple 404 responder */
app.use(function(req, res, next){
    res.status(404);
    if (req.accepts('json')) {
        res.send({ error: 'Not found' });
        return;
    }
    res.send('Not found');
});

/* Error handler */
app.use(function(err, req, res, next){
    console.error('500 something is broken: '+err);
    res.send(500, err);
});

/*** start server */
app.listen(port, function() {
    console.log('Listening on ' + port);
});


