/* 
 Main server file for sendmail app
*/

/*** Application settings */
var s = {};
s.port = process.env.PORT || 5000; // heroku port || local test port
s.testing = (s.port == 5000); // the port tells us if we're testing
s.host = 'https://sendmail4911.herokuapp.com';
if(s.testing) {
    s.host = 'http://localhost:5000';
}

/*** Required modules */
var express = require('express');
var request = require('request');
var node_redis = require('redis');
var RedisStore = require('connect-redis')(express);
var url = require('url');

/*** Establish database connection */
s.db_url = url.parse('redis://localhost:6379');
if(process.env.REDISTOGO_URL){
    s.db_url = url.parse(process.env.REDISTOGO_URL);
}
s.redis = node_redis.createClient(s.db_url.port, s.db_url.hostname);
if(s.db_url.auth) {
    s.db_pass = s.db_url.auth.split(":")[1];
    s.db_auth = function(){ s.redis.auth(s.db_pass); };
    s.redis.addListener('connected', s.db_auth);
    s.redis.addListener('reconnected', s.db_auth);
    s.db_auth();
}

/*** Local requires */
var secrets = require('./secrets.json');   /* keys, codes, etc. */
var auth    = require('./lib/auth.js')(s); /* lib for auth routes */
var user    = require('./lib/user.js')(s); /* user routes, api calls */
var mail    = require('./lib/mail.js')(s); /* mail handling methods */
var error   = require('./lib/error.js');   /* error handling methods */

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
app.use(express.static(__dirname + '/static', {maxAge: 31536000})); // TODO cache bust me
app.use('/views', express.static(__dirname + '/views'));

// middleware for post data processing
app.use(express.json());
app.use(express.urlencoded()); 

// cookie processing for session
app.use(express.cookieParser(secrets.cookie_pass || 'dumb pass'));

// use express's session handling for most of user management
app.use(express.session({
    store: new RedisStore({client: s.redis})
}));

/*** Endpoints */
app.get('/', function(req, res){
    var template = 'landing';
    var opts = {'gauth_url': auth.gauth_url};
    if(req.session.error) {
        opts.err = "There was an error logging in";
    } else if(req.session.authenticated) {
        template = 'main';
        opts = {'loading': req.session.loading,
            'now': (new Date()).toJSON().slice(0,-5) };
    }
    res.render(template, opts);
});
app.get('/extensionauth', function(req, res){
    //TODO use a flagged version of this URL or set a session variable or someting, so that the extension knows whether to act or not on callback
    res.redirect(auth.gauth_url);
});
app.get('/profile', user.profile);
app.get('/logout', auth.logout);
app.get(auth.authroute, auth.authorize);
app.post('/schedule', mail.schedule); /* TODO in terms of our api,
* should we accept all here (http://expressjs.com/3x/api.html#app.all)
* or would it just obfuscate things? thoughts?
*/
app.get('/mailforuser', mail.pending); /* TODO totally need help naming this route */
app.all('/deletemail/:id?', mail.del); /* TODO tempted to just accept delete ha, again naming =\ */

/*** Add error handlers */
require('./lib/error.js')(app);

/*** Start server */
app.listen(s.port, function() {
    console.log('Listening on ' + s.port);
});
