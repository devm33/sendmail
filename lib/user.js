/* Module for user related functions and routes */
var user = {};
module.exports = user;

user.profile = function(req, res){
    /* Route to fetch a users basic google profile data, given an
     * authenticated session. */
    var auth = req.session; //too long
    if(!auth.name) {
        res.send(401, 'Not authorized');
    }
    else if(auth.error) {
        res.send(503, auth.error);
    }
    else if(auth.profile) {
        res.send(auth.profile);
    }
    else {   
        res.send(409, {'status':'not ready'});
    }
};

