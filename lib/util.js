/* Module for cross-project utility functions or aliases */
var util =  {};
module.exports = util;

util.errlog = function(s) {
    /* Print the stack trace whenever we log an error */
    console.error(s);
    console.trace();
};

/* TODO add an function to use as a default node-redis callback function
 * that basically just calls errlog if there's an error */

/* TODO would be nice to have a log (for debug) function that optionally
 * console logs in local testing for development */
