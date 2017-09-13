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
			var query  = {
				batch: 10
			}
			URLService.getSeedURLToCrawl(query, function(err, result){
				if (err) {
					console.log(err)
					return callback(ERROR.API_FAIL)
				}

				var replyObj = JSON.parse(result)
				if (typeof replyObj.data == "undefined" || replyObj.data.length==0) {
					return callback(ERROR.NO_VALID_SEED_URL)
				}
				callback(null, replyObj.data)
			})
		},
		processSeed: ["getSeedUrl", function(results, processCallback){
			var seedUrls = results.getSeedUrl
			async.each(seedUrls, function(seedUrl, callback){
				// console.log("processSeed " + seedUrl.url)
				processSeed(seedUrl, callback)
			}, function(){
				processCallback()
			})
		}],
		
	},function(err, results){
		setTimeout(start, 1000)
		if (err) console.log(err)
	})
}

function processSeed(seedUrl, processCallback){
	async.auto({
		downloadSeed: function(callback){
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
					var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_error,type=seed,domain=' + seedUrl.domain + ' value=1 ' + (+new Date()) + '000000"'
					exec(cmd, function(){})
					return callback(ERROR.DOWNLOAD_FAIL)
				}
					
			})
		},
		getURL: ["downloadSeed", function(results, callback){
			var htmlContent = results.downloadSeed
			var site = seedUrl.site
			var article_processor = site.article_processor
			var article_pattern_match = site.article_pattern.pattern_match
			var articleURL = parser.parseURL(htmlContent, [article_pattern_match], site.root_url)

			if (articleURL.length==0){
				var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "parse_error,type=seed,domain=' + seedUrl.domain + ' value=1 ' + (+new Date()) + '000000"'
				exec(cmd, function(){})
			}

			articleURL = articleURL.map(function(x){
				return {
					"type": "article",
					"url": x.replace("https","http"),
					"domain": seedUrl.domain
				}
			})
			MsgQueue.send("URLUpdate", JSON.stringify(articleURL))

			return callback(null, articleURL)
		}]
	}, function(err, results){
		var articleURLs = results.getURL

		var data =  {
			"url": seedUrl.url,
			"processSeed.status" : "finish",
			"processSeed.processAt" : new Date()
		}

		if (err){
			data["processSeed.status"] = "error"
			data["msg"] = "Cannot download url"
		} if (!articleURLs || articleURLs.length==0){
			data["processSeed.status"] = "error"
			data["msg"] = "Parser Error"
		} else {
			var cmd = 'curl -s "http://monitor.boomerang.net.vn:8086/write?db=mydb" --data-binary "get_success,type=seed,domain=' + seedUrl.domain + ' value=1 ' + (+new Date()) + '000000"'
			// console.log("seed success ... ", cmd)
			exec(cmd, function(){})
		}
		MsgQueue.send("URLUpdate", JSON.stringify(data))

		return processCallback()
	})
}



