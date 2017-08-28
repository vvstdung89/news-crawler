var path = require("path")
var colors = require('colors');
var producer;
var level
var appName = __Config.SERVICE_NAME

var LOG_LEVEL = __Config.LOG_LEVEL || 2

var Logger = function(){}
var logger = new Logger();

var path = require("path")

Object.defineProperty(global, '__stack', {
	get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
	get: function() {
        return __stack[2].getLineNumber();
    }
});

Object.defineProperty(global, '__filenameLog', {
	get: function() {
        return __stack[2].getFileName();
    }
});


Object.defineProperty(global, '__function', {
	get: function() {
        return __stack[2].getFunctionName();
    }
});



function printStr(data){
	var date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
	if (data.loglevel==0) var level = "ERROR"
	if (data.loglevel==1) var level = "WARNING"
	if (data.loglevel==2) var level = "INFO"
	if (data.loglevel==3) var level = "DEBUG"


	if (data["function"] && data["function"]!="module.exports"){
		var out = date + " ["+level+":" + data["filename"] + " " + data["function"] + ":" + data.line + "]: " + data.message		
	} else
		var out = date + " ["+level+":" + data["filename"] + " main:" + data.line + "]: " + data.message

	if (data.loglevel==0 && LOG_LEVEL >= 0) console.log(out.red);
	if (data.loglevel==1 && LOG_LEVEL >= 1) console.log(out.yellow);
	if (data.loglevel==2 && LOG_LEVEL >= 2) console.log(out.white);
	if (data.loglevel==3 && LOG_LEVEL >= 3) console.log(out.green);
	
}

Logger.prototype.debug = function(str){
	var data = {
		"app": appName,
		"time": (new Date()).getTime(),
		"filename": path.basename(__filenameLog),
		"function": __function,
		"line": __line,
		"message": (typeof str == "object") ? JSON.parse(str) : str,
		"loglevel": 3
	}
	printStr(data)
}

Logger.prototype.info = function(str){
	var data = {
		"app": appName,
		"time": (new Date()).getTime(),
		"filename": path.basename(__filenameLog),
		"function": __function,
		"line": __line,
		"message": (typeof str == "object") ? JSON.parse(str) : str,
		"loglevel": 2
	}
	printStr(data)
}

Logger.prototype.warning = function(str){
	var data = {
		"app": appName,
		"time": (new Date()).getTime(),
		"filename": path.basename(__filenameLog),
		"function": __function,
		"line": __line,
		"message": (typeof str == "object") ? JSON.parse(str) : str,
		"loglevel": 1
	}
	printStr(data)
}

Logger.prototype.error = function(str){
	var data = {
		"app": appName,
		"time": (new Date()).getTime(),
		"filename": path.basename(__filenameLog),
		"function": __function,
		"line": __line,
		"message": (typeof str == "object") ? JSON.parse(str) : str,
		"loglevel": 0
	}
	printStr(data)
}


exports = module.exports = logger;

Object.defineProperty(global, '__Logger', {
	get: function() {
        return logger;
    }
});