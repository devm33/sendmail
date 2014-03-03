/* 
 Main server file for sendmail app
*/

/*** application settings */
var port = process.env.PORT || 5000; // heroku port || local test port
var testing = (port == 5000); // the port tells us if we're testing
var host = 'https://sendmail4911.herokuapp.com';
if(testing) {
    host = 'http://localhost:5000';
}

/*** required modules */
var express = require('express');
var request = require('request');
var secrets = require('./secrets.json');   /* keys, codes, etc. */
var auth    = require('./lib/auth.js')(host);/* lib for auth routes */
var user    = require('./lib/user.js');    /* user routes, api calls */
var mail    = require('./lib/mail.js');    /* mail handling methods */
var error   = require('./lib/error.js');   /* error handling methods */

/*** configure application */
var app = express();
app.configure(function(){
    // turn on default logging
    app.use(express.logger());

    // use ejs for templates
    app.set('view engine', 'ejs');
    app.set('views', __dirname + '/views');

    // enable gzipping
    app.use(express.compress());

    // serve files out of static dir
    app.use(express.static(__dirname + '/static', {maxAge: 31557600000}));

    // cookie processing for session
    app.use(express.cookieParser(secrets.cookie_pass || 'dumb pass'));

    // use express's session handling for most of user management
    app.use(express.session());
});

/*** endpoints */
app.get('/', function(req, res){
    var template = 'landing';
    var opts = {'gauth_url': auth.gauth_url};
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
app.get('/profile', user.profile);
app.get('/logout', auth.logout);
app.get(auth.authroute, auth.authorize);

/*** add error handlers */
require('./lib/error.js')(app);

/*** start server */
app.listen(port, function() {
    console.log('Listening on ' + port);
});


