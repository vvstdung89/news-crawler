exports = module.exports = function (app, router){
    
    // middleware to use for all requests -> check token, authentication ...
    router.use(function(req, res, next) {
        next()
    });
};
