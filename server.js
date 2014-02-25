/* 
 Main server file for sendmail app
*/

/*** requires */
var express = require('express');


/*** global vars */
var port = process.env.PORT || 5000; // heroku port || local test port
var testing = (port == 5000); // the port tells us if we're testing
var oauth2 = 'oauth2callback'; // route for oauth2 redirect
var hostroot = 'https://sendmail4911.herokuapp.com/';
if(testing) {
    hostroot = 'http://localhost:5000/';
}
var app = express();
var secrets = require('./secrets.json');
var gauth_url = 'https://accounts.google.com/o/oauth2/auth?' +
    'scope=email%20profile&' +
    'state=%2Fprofile&' +
    'redirect_uri=' + encodeURIComponent(hostroot) + oauth2 + '&' +
    'response_type=code&' +
    'client_id=' + secrets['web']['client_id'] + '&' +
    'access_type=offline';

/*** config */
// turn on default logging
app.use(express.logger());

// use ejs for templates
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// serve files out of static dir
app.use(express.static(__dirname + '/static'));

// enable gzipping
app.use(express.compress());

// cookie processing for session
app.use(express.cookieParser(secrets['cookie_pass'] || 'dumb pass'));

// use express's session handling will need later
app.use(express.session());

/*** endpoints */
app.get('/', function(req, res){
    res.render('landing', {
        "gauth_url": gauth_url
    });
});

app.get('/'+oauth2, function(req, res){
    console.log(req);
    res.json(req.query);  
});


/*** start server */
app.listen(port, function() {
    console.log('Listening on ' + port);
});

