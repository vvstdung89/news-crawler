var UrlDB = require("../../models/Url").DBModel
var MsgQueue = require("../libs/MsgQueue")
var async = require("async")

_5min = 5*60*1000
_15min = 15*60*1000

module.exports = {
	getSeedURLToCrawl: function(req, res){
		var domain = req.body.domain || []

		var query = {
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
				}
			]
		}
		
		var update = {
			"processSeed.status" : "processing",
			"processSeed.processAt": new Date()
		}

		if (domain.length>0){
			query.domain = {
				$in: domain
			}
		}

		console.log(query, update)
		UrlDB.findOneAndUpdate(query, update, {sort: {"processSeed.processAt": 1}},  function(err, obj){			
			replyMessage(err, obj, res)
		})
	},

	getArticleURLToCrawl: function(req, res){
		var domain = req.body.domain || []

		var query = {
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
				}
			]
		}
		
		var update = {
			"processArticle.status" : "processing",
			"processArticle.processAt": new Date()
		}

		if (domain.length>0){
			query.domain = {
				$in: domain
			}
		}


		console.log(query)
		UrlDB.findOneAndUpdate(query, update,{sort: {"createAt": 1}}, function(err, obj){			
			replyMessage(err, obj, res)
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

			UrlDB.findOneAndUpdate(query, url, {upsert:true },function(err, data){			
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

		UrlDB.findOneAndUpdate(query, data, function(){

		})
	}
	


})