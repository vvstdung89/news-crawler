require("../../Config")
require("../libs/Logger")
var program = require("commander")
var async = require("async")
var request = require("request")
var URLService = require("../Services/URL")
var parser = require("./parser")
var exec = require("child_process").exec
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
	SEED_WAITTIME_ERROR: new Error("SEED_WAITTIME_ERROR"),
	API_FAIL: new Error("API_FAIL"),
	DOWNLOAD_FAIL: new Error("DOWNLOAD_FAIL")
}

start()
//process
function start(){
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
		processSeed: ["getSeedUrl", function(results, callback){
			var seedUrls = results.getSeedUrl
			
		}],
		downloadSeed: ["processSeed", function(results, callback){
			var seedUrl = results.getSeedUrl
			// console.log(seedUrl)

			var option = {
				url: seedUrl.url,
				method: "GET",
				timeout : 10000,
			}

			request(option, function(err, res, body){
				if (res && res.statusCode==200){
					return callback(null, body)			
				}
				else {
					var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_error,type=seed,domain=' + seedUrl.domain + ' value=1 \`date +%s\`000000000"'
					exec(cmd, function(){})
					return callback(ERROR.DOWNLOAD_FAIL)
				}
					
			})
		}],
		getURL: ["downloadSeed", function(results, callback){
			var htmlContent = results.downloadSeed
			var seedUrl = results.getSeedUrl
			var site = seedUrl.site
			var article_processor = site.article_processor

			var article_pattern_match = site.article_pattern.pattern_match

			var articleURL = parser.parseURL(htmlContent, [article_pattern_match], site.root_url)

			console.log(articleURL.length)
			articleURL = articleURL.map(function(x){
				return {
					"type": "article",
					"url": x.replace("https","http"),
					"domain": seedUrl.domain,
					isEnable: site.isEnable
				}
			})
			MsgQueue.send("URLUpdate", JSON.stringify(articleURL))
			return callback(null)
		}]
	},function(err, results){
		
		setTimeout(start, 1000)

		if (err) console.log(err)
		
		var seedUrl = results.getSeedUrl
		if (seedUrl && seedUrl.url){
			var data =  {
				url: seedUrl.url,
				"processSeed.status" : "finish",
				"processSeed.processAt" : new Date()
			}
			if (err){
				if (err.message == "DOWNLOAD_FAIL") {
					data["processSeed.status"] = "error"
					data["msg"] = "Cannot download url"
				}
			} else {
				var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_succes,type=seed,domain=' + seedUrl.domain + ' value=1 \`date +%s\`000000000"'
				exec(cmd, function(){})
			}
			return MsgQueue.send("URLUpdate", JSON.stringify(data))
		}
	})
}




