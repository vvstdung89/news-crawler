var UrlDB = require("../../models/Url").DBModel
var SiteDB = require("../../models/Site").DBModel
var MsgQueue = require("../libs/MsgQueue")
var async = require("async")

_5min = 5*60*1000
_15min = 15*60*1000
_30min = 30*60*1000
_60min = 60*60*1000

module.exports = {
	getSeedURLToCrawl: function(req, res){
		var priority = req.body.priority 
		var batch = req.body.batch || 5

		var query = {
			isEnable: true,
			processSeedTime: {$lt: new Date() - _5min}
		}

		if (priority){
			query.priority = priority
		}

		async.auto({
			getEnableSite: function(callback){
				SiteDB.findOneAndUpdate(query, {
					processSeedTime: new Date()
				},{
					processSeedTime: 1
				}).exec(callback)
			},
			getBatchUrl: ["getEnableSite", function(results, callback){
				var site = results.getEnableSite
				if (!site) return callback(null, [])

				var waitTime = _60min
				if (site.priority=="high") waitTime = _15min
				if (site.priority=="medium") waitTime = _30min
				if (site.priority=="low") waitTime = _60min

				var _arr = []
				for (var i = 0; i < batch; i++) _arr.push(i)
				var urls = []

				async.eachSeries(_arr, function(_, callback){
					UrlDB.findOneAndUpdate({
						domain: site.domain,
						type: "seed",
						$or: [
							{
								"processSeed": {$exists: false}
							},
							{
								"processSeed.status" : "processing",
								"processSeed.processAt": {$lt: new Date() - _5min}
							},
							{
								"processSeed.status" : "error",
								"processSeed.processAt": {$lt: new Date() - _15min}
							},
							{
								"processSeed.status" : "finish",
								"processSeed.processAt": {$lt: new Date() - waitTime}
							},
						]
					}, {
						"processSeed.status" : "processing",
						"processSeed.processAt": new Date()
					}, {
						sort: {"processSeed.processAt": 1}
					}).lean().exec(function(err, obj){			
						if (obj){
							obj.site = site
							urls.push(obj)
						}
						callback()
					})
				}, function(){
					callback(null, urls)
				})	
			}]
		}, function(err, results){
			if (err)
				return replyMessage(err, [], res)
			replyMessage(err, results.getBatchUrl, res)
		})

	},

	getArticleURLToCrawl: function(req, res){
		var priority = req.body.priority 
		var batch = req.body.batch || 5

		var query = {
			isEnable: true,
			$or: [
				{ processArticleTime: {$lt: new Date() - _5min} },
				{ processArticleTime: {$exists: false } }
			]
			
		}

		if (priority){
			query.priority = priority
		}

		async.auto({
			getEnableSite: function(callback){
				SiteDB.findOneAndUpdate(query, {
					processArticleTime: new Date()
				}, {
					processArticleTime: 1
				}).exec(callback)
			},
			getBatchUrl: ["getEnableSite", function(results, callback){
				var site = results.getEnableSite
				if (!site) return callback(null, [])
				console.log(site)
				var _arr = []
				for (var i = 0; i < batch; i++) _arr.push(i)
				var urls = []
				async.eachSeries(_arr, function(_, callback){
					UrlDB.findOneAndUpdate({
						domain: site.domain,
						type: "article",
						$or: [
							{
								"processArticle": {$exists: false}
							},
							{
								"processArticle.status" : "processing",
								"processArticle.processAt": {$lt: new Date() - _5min}
							},
							{
								"processArticle.status" : "error",
								"processArticle.processAt": {$lt: new Date() - _15min}
							},
						]
					}, {
						"processArticle.status" : "processing",
						"processArticle.processAt": new Date()
					}, {
						sort: {"createAt": 1}
					}).lean().exec(function(err, obj){	
						console.log(obj)		
						if (obj){
							obj.site = site
							urls.push(obj)
						}
						callback()
					})
				}, function(){
					callback(null, urls)
				})	
			}]
		}, function(err, results){
			if (err)
				return replyMessage(err, [], res)
			replyMessage(err, resutls.getBatchUrl, res)
		})
	}
}

function replyMessage(err, data, res){
	var reply = {}
	if (err) {
		console.log(err)
		reply.status=-1
		reply.msg = err.message
	} else {
		if (!data){
			reply.status=-2
			reply.msg = "Data not exist"
		} else {
			reply.status=0
			reply.data=data	
		}
	}
	res.json(reply)
}

MsgQueue.createWORKER("URLUpdate",5, function(worker, message){
	worker.ack()

	var data = JSON.parse(message.toString().trim())
	if (data instanceof Array){
		async.eachSeries(data, function(url, callback){
			var query = {url: url.url}
			var updateData = url
			var curDate = new Date()

			updateData["lastUpdateAt"] = curDate
			updateData["$setOnInsert"] = {
				createAt: curDate
			}

			UrlDB.findOneAndUpdate(query, url, {upsert:true},function(err, data){			
				callback()
			})
		})
	} else if (data.url){
		var query = {url: data.url}
		var updateData = data
		var curDate = new Date()

		updateData["lastUpdateAt"] = curDate
		updateData["$setOnInsert"] = {
			createAt: curDate
		}

		UrlDB.findOneAndUpdate(query, data, {upsert:true}, function(){

		})
	}
	


})