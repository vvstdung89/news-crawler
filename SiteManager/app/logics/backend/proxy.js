var async = require("async")
var exec = require("child_process").exec
var fs = require("fs")
var proxyFilePath = "../resource/proxy.txt"
var proxyList = fs.readFileSync(proxyFilePath)


var availableList = []

function checkProxy(){
	var tmpList = []
	async.mapLimit(proxyList, 10, function(proxy, callback) {
	    var proxyArray = proxy.split(":")
	    var cmd = `curl -Isf -x ${proxyArray[0]}:${proxyArray[1]} -U ${proxyArray[2]}:${proxyArray[3]} google.com`
	    exec(cmd, {timeout: 5000}, function(err){
	    	if (!err){
	    		tmpList.push(proxy)
	    	} else {
	    		console.log("error " + proxy)
	    	}
	    	callback()
	    })
	}, function(err, results) {
		availableList = tmpList
	    setTimeout(checkProxy, 30*60*1000)
	})
}

checkProxy()

var cnt = {}
exports = module.exports = {
	getNextProxy: function(seed){
		if (!cnt[seed]) cnt[seed]=0
		cnt[seed] = (cnt[seed] + 1)	 % availableList.length
		var proxy = availableList[cnt[seed]]
		return proxy
	},
	get: function(req, res){
		var seed = req.query.key || "default"
		var proxy = exports.getNextProxy(seed)
		res.end(proxy)
	}
}