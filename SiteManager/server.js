var Logger = require("./app/logics/libs/Logger")

var compression = require('compression')

var mongoose = require("mongoose")
mongoose.connect(__Config.MONGO);

// call the packages we need
var express    = require('express');        // call express
var app        = express();                 // define our app using express
app.use(compression())

var bodyParser = require('body-parser');

var fs = require("fs")

var responseTime = require('response-time');
var errorHandler = require('errorhandler');

var util = require("./app/logics/libs/Utils.js");
util.getIP();

//configure app

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());	
app.use(express.static(process.cwd() + '/app/public'));


app.set('views', './app/templates');
var ECT = require('ect');
var ectRenderer = ECT({ watch: true, root: __dirname + '/app/templates', ext : '.ect' });

// app.set('view engine', 'jade');
app.set('view engine', 'ect');
app.engine('ect', ectRenderer.render);


app.use(responseTime(function (req, res, time) {
}));

if (__Config.NODE_ENV !== "production"){
	app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else {
	app.use(errorHandler());
}

var router = express.Router(); 

require('./middleware.js')(app, router);
require('./route.js')(app, router)

if (__Config.PORT) {
	var port = __Config.PORT
	var tester = createServer(port);
	function createServer(port){
		var tester = app.listen(port)
		.once('error', function (err) {
			if (err.code == 'EADDRINUSE') {
				__Logger.error("Cannot use this port:" +port + ":"+ err.code)
				process.exit(-1)
			}
		})
		.once('listening', function() {
			__Logger.info("Start listening " + port + " ... ");
		});
	}
}
