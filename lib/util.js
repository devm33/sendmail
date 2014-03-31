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

/* TODO would be nice to have a log (for debug) function that optionally
 * console logs in local testing for development */
