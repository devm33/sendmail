/* Module for user related functions and routes */
module.exports = function(settings) {
    var userlib = {};

    /* requires */
    var extend = require('util')._extend;
    if (!settings || !settings.redis) {
        throw new Error("lib/user.js called without redis object");
    }
    var checkcallback = require('./util.js').checkcallback;
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
            /* TODO this needs to be more actionable as in it needs to
             * do something! one, some, none, or maybe all of these:
             *  - compete with potentially existing profile load call
             *     (locking or something?)
             *  - subscribe to existing load call (if locked)
             *     (redis can probably help best for that)
             *  - not send 409 and make this ajax call a long pull
             *  - die silent and the user will simply have a session
             *     without their little picture loaded
             * 
             *  - or perhaps more drastically the main.ejs page simply
             *    should not load at all (or load less) if the profile
             *    is not ready
             *
             * In any case the flags and flow for handling this is messy
             * and bug prone, so it should be handled with care. 
             */
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
        redis.hgetall('user:'+id, checkcallback(callback));
    };

    userlib.loadUserWithKey = function(key, callback) {
        /* Load user via key look up */
        redis.get('key:'+key, function(err, user_id){
            if(err){
                callback = checkcallback(callback);
                callback(err, user_id);
            }
            else{
                userlib.load(user_id, callback);
            }
        });
    };

    return userlib;
};
