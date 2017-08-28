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
	NO_VALID_SEED_URL: new Error("NO_VALID_SEED_URL"),
	API_FAIL: new Error("API_FAIL"),
	DOWNLOAD_FAIL: new Error("DOWNLOAD_FAIL")
}
//process
async.auto({
	getSeedUrl: function(callback){
		var query  = {}
		if (isLimitDomain){
			query.domain = limitDomain
		}

		URLService.getSeedURLToCrawl(query, function(err, result){
			if (err) {
				console.log(err)
				return callback(ERROR.API_FAIL)
			}

			var replyObj = JSON.parse(result)
			if (typeof replyObj.data == "undefined") {
				return callback(ERROR.NO_VALID_SEED_URL)
			}

			callback(null, replyObj.data)
		})
	},
	downloadSeed: ["getSeedUrl", function(results, callback){
		var seedUrl = results.getSeedUrl
		console.log(seedUrl)

		var option = {
			url: seedUrl.url,
			method: "GET"
		}

		request(option, function(err, res, body){
			console.log(err)
			if (res.statusCode==200){
				return callback(null, body)			
			}
			else 
				return callback(ERROR.DOWNLOAD_FAIL)
		})
	}],
	getURL: ["downloadSeed", function(results, callback){
		var htmlContent = results.downloadSeed
		var seedUrl = results.getSeedUrl
		var articleURL = parser.parseURL(htmlContent, ["^(http(s)?:\\/\\/)?(.*?\\\\.)?vietnamnet.vn\/.*?(\\d{3,})(.html|.htm|.chn)$"], "http://vietnamnet.vn")
		articleURL = articleURL.map(function(x){
			return {
				"type": "article",
				"url": x.replace("https","http"),
				"domain": seedUrl.domain
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
	var seedUrl = results.getSeedUrl

	if (seedUrl && seedUrl.url){
		var data =  {
			url: seedUrl.url,
			"processSeed.status" : "finish"
		}
		if (err){
			if (err.message == "DOWNLOAD_FAIL") {
				data["processSeed.status"] = "error"
				data["msg"] = "Cannot download url"
			}
		}
		return MsgQueue.send("URLUpdate", JSON.stringify(data))
	}
})



