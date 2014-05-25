/* Module to add error handlers to an express app */
/*jshint -W098 *//* use function statements need arg count for express functionality */

module.exports = function(app) {
    var errlog = require('./util.js').errlog;

    /* Simple 404 responder */
    app.use(function(req, res, next){
        res.status(404);
        if (req.accepts('json')) {
            res.send({ error: 'Not found' });
            return;
        }
        res.send('Not found');
    });

    /* Error handler */
    app.use(function(err, req, res, next){
        errlog('500 something is broken: '+err);
        res.send(500, err);
    });

};
