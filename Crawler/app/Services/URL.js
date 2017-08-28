var request = require('request');
var service_name = "url";

exports = module.exports = {

	getSeedURLToCrawl: function(info, callback){
		var caller = "getSeedURLToCrawl";
		var service_location = __Config.BACKEND+"/"+service_name;
		
		request.post(
		    service_location + '/' + caller,
		    { form: info },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            callback(null, body);
		        } else if (error){
		        	callback(error, body);
		        } else {
					callback("Reply status code: " + response.statusCode);
		        }
		    }
		);
	},

	getArticleURLToCrawl: function(info, callback){
		var caller = "getArticleURLToCrawl";
		var service_location = __Config.BACKEND+"/"+service_name;
		
		request.post(
		    service_location + '/' + caller,
		    { form: info },
		    function (error, response, body) {
		        if (!error && response.statusCode == 200) {
		            callback(null, body);
		        } else if (error){
		        	callback(error, body);
		        } else {
					callback("Reply status code: " + response.statusCode);
		        }
		    }
		);
	},
};


