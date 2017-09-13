require("../../Config")
require("../libs/Logger")
var program = require("commander")
var async = require("async")
var exec = require("child_process").exec
var request = require("request")
var URLService = require("../Services/URL")
var parser = require("./parser")
var MsgQueue = require("../libs/MsgQueue")
MsgQueue.createPUSH("URLUpdate")
MsgQueue.createPUSH("ArticleUpdate")

// parse parameter
program
  .version('1.0.0')
  .option('-d, --limit_domain <limit_domain>', 'List of domain')
  .parse(process.argv);

var limitDomain = []
if (typeof program.limit_domain != "undefined"){
	limitDomain = program.limit_domain.split(",").map(function(x) {
		return x.trim()
	})

}
var isLimitDomain = (limitDomain.length > 0)

if (isLimitDomain)
	__Logger.info("Get url of " + limitDomain.join(", "))	
else __Logger.info("Get url of all domain")

var ERROR = {
	NO_VALID_ARTICLE_URL: new Error("NO_VALID_ARTICLE_URL"),
	API_FAIL: new Error("API_FAIL"),
	DOWNLOAD_FAIL: new Error("DOWNLOAD_FAIL"),
	PARSE_FAIL: new Error("PARSE_FAIL"),
}
//process
start()

function start(){
	async.auto({
		getArticleUrl: function(callback){
			var query  = {
				batch: 10
			}

			URLService.getArticleURLToCrawl(query, function(err, result){
				if (err) {
					console.log(err)
					return callback(ERROR.API_FAIL)
				}

				var replyObj = JSON.parse(result)
				if (typeof replyObj.data == "undefined" || replyObj.data.length==0) {
					return callback(ERROR.NO_VALID_ARTICLE_URL)
				}


				callback(null, replyObj.data)
			})
		},
		processArticle: ["getArticleUrl", function(results, processCallback){
			var articleUrls = results.getArticleUrl
			async.each(articleUrls, function(articleUrl, callback){
				// console.log("processArticle " + articleUrl.url)
				processArticle(articleUrl, callback)
			}, function(){
				processCallback()
			})
		}],
		
	},function(err, results){
		setTimeout(start,1000)
		if (err) console.log(err)
	})
}


function processArticle(articleURL, processCallback){
	async.auto({
		downloadArticle: function(callback){

			var option = {
				url: articleURL.url,
				method: "GET",
				timeout : 10000,
			}

			request(option, function(err, res, body){
				if (res && res.statusCode==200){
					return callback(null, body)			
				}
				else {
					var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_error,type=article,domain=' + articleURL.domain + ' value=1 ' + (+new Date()) + '000000"'
					exec(cmd, function(){})
					return callback(ERROR.DOWNLOAD_FAIL)
				}
			})
			
		},
		getURL: ["downloadArticle", function(results, callback){
			var htmlContent = results.downloadArticle

			var site = articleURL.site
			var article_processor = site.article_processor

			//parse article url
			var article_pattern_match = site.article_pattern.pattern_match
			var articleURLs = parser.parseURL(htmlContent, [article_pattern_match], site.root_url)

			articleURLs = articleURLs.map(function(x){
				return {
					"type": "article",
					"url": x.replace("https","http"),
					"domain": articleURL.domain
				}
			})

			//parse aritcle content
			var _1week = 7*24*60*60*1000
			var requireFields = ["text","title","publish_date"]
			var articleContent = parser.parseArticle(htmlContent, article_processor, site.use_diffbot)

			for (var key in articleContent){
				if (!articleContent[key]) delete articleContent[key]
			}
			articleContent.domain = site.domain
			articleContent.url = articleURL.url

			if (articleContent.publish_date && (new Date() - articleContent.publish_date < _1week)){
				MsgQueue.send("URLUpdate", JSON.stringify(articleURLs))
			} 

			//check require field
			var satisfyRequireField = true
			for (var i in requireFields){
				var field = requireFields[i]
				if (!articleContent[field]){
					satisfyRequireField = false
					break
				}
			}

			if (!satisfyRequireField) {
				var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "parse_error,type=article,domain=' + site.domain + ' value=1 ' + (+new Date()) + '000000"'
					exec(cmd, function(){})
				
				return callback(ERROR.PARSE_FAIL)
			}

			MsgQueue.send("ArticleUpdate", JSON.stringify(articleContent))
			return callback(null)
		}],
	}, function(err, results){
		
		var data =  {
			url: articleURL.url,
			"processArticle.status" : "finish",
			"processArticle.processAt" : new Date(),
			"processArticle.msg": ""
		}

		if (err){
			if (err.message == "DOWNLOAD_FAIL") {
				data["processArticle.status"] = "error"
				data["processArticle.msg"] = "DOWNLOAD_FAIL"
				data["$inc"] = { "processArticle.retry" : 1 }
			}

			if (err.message == "PARSE_FAIL") {
				data["processArticle.status"] = "invalid"
				data["processArticle.msg"] = "PARSE_FAIL"
			}

		} else {
			var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_success,type=article,domain=' + articleURL.domain + ' value=1 ' + (+new Date()) + '000000"'
			exec(cmd, function(){})
		}

		console.log(data)
		MsgQueue.send("URLUpdate", JSON.stringify(data))
		return processCallback()
	})
}




