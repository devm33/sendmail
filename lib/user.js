/* Module for user related functions and routes */
module.exports = function(settings) {
    var userlib = {};

    /* requires */
    var extend = require('util')._extend;
    if (!settings || !settings.redis) {
        throw new Error("util/user.js called without redis object");
    }
    var redis = settings.redis;

    /* routing functions */
    userlib.profile = function(req, res){
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

    /* db functions */
    userlib.save = function(user) {
        /* Save user into database
         *
         * Warning, keys and values of user object will be saved as
         * strings one level deep.
         */
        redis.hmset('user:'+user.id, user);
        /* TODO will need hash from email -> id here for forwarding
         * look-up
         */
    };

    userlib.load = function(id, callback) {
        /* Load user from database into js object */
        redis.hgetall('user:'+id, callback);
    };

    return userlib;
};
