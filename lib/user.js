/* Module for user related functions and routes */
var user = {};
module.exports = user;

/* requires */
var extend = require('util')._extend;

user.profile = function(req, res){
    /* Route to fetch a users basic google profile data, given an
     * authenticated session. */
    var sesh = req.session; //too long
    if(!sesh.authenticated) {
        res.send(401, 'Not authorized');
    }
    else if(sesh.error) {
        res.send(503, sesh.error);
    }
    else if(sesh.user && !sesh.loading) {
        var profile = extend({}, sesh.user);
        delete profile.refresh_token; /* no need to send this client
         * also no harm, but whatever */
        res.send(profile);
    }
    else {   
        res.send(409, {'status':'not ready'});
    }
};

