/* 
 Main server file for sendmail app
*/

/*** Application settings */
var port = process.env.PORT || 5000; // heroku port || local test port
var testing = (port == 5000); // the port tells us if we're testing
var host = 'https://sendmail4911.herokuapp.com';
if(testing) {
    host = 'http://localhost:5000';
}

/*** Required modules */
var express = require('express');
var request = require('request');
var RedisStore = require('connect-redis')(express);
var secrets = require('./secrets.json');   /* keys, codes, etc. */
var auth    = require('./lib/auth.js')(host);/* lib for auth routes */
var user    = require('./lib/user.js');    /* user routes, api calls */
var mail    = require('./lib/mail.js');    /* mail handling methods */
var error   = require('./lib/error.js');   /* error handling methods */

/*** Establish database connection */
var rtg, redis, redis_opts;
if (process.env.REDISTOGO_URL) {
    rtg   = require("url").parse(process.env.REDISTOGO_URL);
    redis = require("redis").createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
    redis = require("redis").createClient();
}

/*** Configure express application */
var app = express();
// turn on default logging
app.use(express.logger());

// use ejs for templates
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// enable gzipping
app.use(express.compress());

// serve files out of static dir
app.use(express.static(__dirname + '/static', {maxAge: 31557600000}));

// middleware for post data processing
app.use(express.json());
app.use(express.urlencoded()); 

// cookie processing for session
app.use(express.cookieParser(secrets.cookie_pass || 'dumb pass'));

// use express's session handling for most of user management
app.use(express.session({
    store: new RedisStore({client: redis})
}));

/*** Endpoints */
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
app.post('/schedule', mail.schedule); /* TODO in terms of our api,
* should we accept all here (http://expressjs.com/3x/api.html#app.all)
* or would it just obfuscate things? thoughts?
*/

/*** Add error handlers */
require('./lib/error.js')(app);

/*** Start server */
app.listen(port, function() {
    console.log('Listening on ' + port);
});


