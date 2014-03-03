/* Module for user related functions and routes */
var user = {};
module.exports = user;

var request = require('request');

user.profile = function(req, res){
    /* Route to fetch a users basic google profile data, given an
     * authenticated session. */
    var auth = req.session; //too long
    if(!auth.name) {
        res.send(403, 'Not authorized');
    } else if(!auth.id_token) {
        res.send(409, {'status':'not ready'});
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
};

