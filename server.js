/* 
 Main server file for sendmail app
*/

/*** requires */
var express = require('express');
var app = express();


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

// use express's session handling will need later
//app.use(express.session());

/*** endpoints */
app.get('/', function(req, res){
    res.render('landing');
});




/*** start server */
var port = process.env.PORT || 5000; // heroku port || local test port

app.listen(port, function() {
    console.log('Listening on ' + port);
});
