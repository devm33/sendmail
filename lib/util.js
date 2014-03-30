/* Module for cross-project utility functions or aliases */
var util =  {};
module.exports = util;

util.errlog = function(s) {
    /* Print the stack trace whenever we log an error */
    console.error(s);
    console.trace();
};
