require("../../Config")
require("../libs/Logger")
var program = require("commander")
var async = require("async")
var request = require("request")
var URLService = require("../Services/URL")
var parser = require("./parser")
var MsgQueue = require("../libs/MsgQueue")
MsgQueue.createPUSH("URLUpdate")

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
	DOWNLOAD_FAIL: new Error("DOWNLOAD_FAIL")
}
//process
start()
start()
start()
start()
start()
start()
function start(){
	async.auto({
		getArticleUrl: function(callback){
			var query  = {}
			if (isLimitDomain){
				query.domain = limitDomain
			}

			URLService.getArticleURLToCrawl(query, function(err, result){
				if (err) {
					console.log(err)
					return callback(ERROR.API_FAIL)
				}

				var replyObj = JSON.parse(result)
				if (typeof replyObj.data == "undefined") {
					return callback(ERROR.NO_VALID_ARTICLE_URL)
				}

				callback(null, replyObj.data)
			})
		},
		downloadArticle: ["getArticleUrl", function(results, callback){
			var articleURL = results.getArticleUrl
			__Logger.info("Process " + articleURL.url)

			var option = {
				url: articleURL.url,
				method: "GET",
				timeout : 10000,
			}

			request(option, function(err, res, body){
				if (res && res.statusCode==200){
					return callback(null, body)			
				}
				else 
					return callback(ERROR.DOWNLOAD_FAIL)
			})
			
		}],
		getURL: ["downloadArticle", function(results, callback){
			var htmlContent = results.downloadArticle

			var articleURL = parser.parseURL(htmlContent, ["^(http(s)?:\\/\\/)?(.*?\\\\.)?vietnamnet.vn\/.*?(\\d{3,})(.html|.htm|.chn)$"], "https://vietnamnet.vn")
			articleURL = articleURL.map(function(x){
				return {
					type: "article",
					url: x.replace("https","http"),
					domain: results.getArticleUrl.domain
				}
			})
			return callback(null, articleURL)
		}],
		updateURL: ["getURL", function(results, callback){
			var updateURLs = results.getURL || []
			MsgQueue.send("URLUpdate", JSON.stringify(updateURLs))
			callback(null)
		}]
	},function(err, results){
		if (err) console.log(err)
		var articleURL = results.getArticleUrl

		if (articleURL && articleURL.url){
			var data =  {
				url: articleURL.url,
				"processArticle.status" : "finish"
			}
			if (err){
				if (err.message == "DOWNLOAD_FAIL") {
					data["processArticle.status"] = "error"
					data["msg"] = "Cannot download url"
				}
			}
			MsgQueue.send("URLUpdate", JSON.stringify(data))


		}
		setTimeout(start,1000)
	})
}



