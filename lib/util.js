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

utillib.exists = function(object, props) {
    /* Checks for nested existence of objects
     * object should be the object we want to check for existence within
     * props should be a string of the desired properties separated by
     * periods or it can be an array of strings.
     *
     * For example, exists(garage,'car.door.handle') will return true
     * only if garage.car.door.handle is not undefined.
     */
    if(object === undefined) {
        return false;
    }
    if(props === undefined || props.length <= 0) {
        return true; 
    }
    if(typeof props === 'string') {
        props = props.split('.');
    }
    return utillib.exists(object[props.shift()], props);
};
