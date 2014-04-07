/* Module for cross-project utility functions or aliases */
var utillib =  {};
module.exports = utillib;

utillib.errlog = function(s) {
    /* Print the stack trace whenever we log an error */
    console.error(s);
    console.trace();
};

utillib.checkcallback = function(callback) {
    /* Returns just error logging as callback if none given */
    if(callback && typeof callback === 'function') {
        return callback;
    }
    return function(err, msg) {
        if(err) {
            utillib.errlog(msg);
        }
    };
};

utillib.send = function(req, res, err, msg, code) {
    /* Shortcut for sending a properly formatted response given a error
     * status, message, and optional status code */
    if(err && code) {
        res.status(code);
    }
    if(req.accepts('json')) {
        res.send({'success': (err === null), 'message': msg});
    }
    else {
        res.send(msg);
    }
};

/* TODO would be nice to have a log (for debug) function that optionally
 * console logs in local testing for development */
