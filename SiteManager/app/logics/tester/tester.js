var async = require("async")
var parser = require("./parser")
var request = require("request")

var ERROR = {
	DOWNLOAD_FAIL: new Error("DOWNLOAD_FAIL")
}


module.exports = {
	article_pattern: article_pattern,
	article_processor: article_processor
}

function article_pattern(testUrl, rootUrl, pattern, callback){
	async.auto({
		downloadTestUrl: function(callback){
			var option = {
				url: testUrl,
				method: "GET",
				timeout : 10000,
			}
			request(option, function(err, res, body){
				if (res && res.statusCode==200){
					return callback(null, body)			
				}
				else {
					return callback(ERROR.DOWNLOAD_FAIL)
				}	
			})
		},
		getURL: ["downloadTestUrl", function(results, callback){
			var htmlContent = results.downloadTestUrl
			if (!(pattern instanceof Array)) {
				pattern = [pattern]
			}
			
			var articleURL = parser.parseURL(htmlContent, pattern, rootUrl)
			callback(null, articleURL)
		}]
	}, function(err, results){
		if (err) {
			return callback(err)
		}
		callback(null, results.getURL)
	})
}


function article_processor(testUrl, pattern, callback){
	async.auto({
		downloadTestUrl: function(callback){
			var option = {
				url: testUrl,
				method: "GET",
				timeout : 10000,
			}
			request(option, function(err, res, body){
				if (res && res.statusCode==200){
					return callback(null, body)			
				}
				else {
					return callback(ERROR.DOWNLOAD_FAIL)
				}	
			})
		},
		parseArticle: ["downloadTestUrl", function(results, callback){
			var htmlContent = results.downloadTestUrl			
			var articleContent= parser.parseArticle(htmlContent, pattern)
			callback(null, articleContent)
		}]
	}, function(err, results){
		if (err) {
			return callback(err)
		}
		callback(null, results.parseArticle)
	})
}

