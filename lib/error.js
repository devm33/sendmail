/* Module to add error handlers to an express app */

module.exports = function(app) {

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
        console.error('500 something is broken: '+err);
        res.send(500, err);
    });
    
};
