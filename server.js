/* 
 Main server file for sendmail app
*/

//requires
var express = require('express');
var app = express();
app.use(express.logger());

//serve static files
app.use(express.static(__dirname));

//start server on valid port
var port = process.env.PORT || 5000;

app.listen(port, function() {
    console.log("Listening on " + port);
});
