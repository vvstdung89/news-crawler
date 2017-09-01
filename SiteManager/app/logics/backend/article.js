var ArticleDB = require("../../models/Article").DBModel
var MsgQueue = require("../libs/MsgQueue")
var async = require("async")

_5min = 5*60*1000
_15min = 15*60*1000
_30min = 30*60*1000
_60min = 60*60*1000

module.exports = {
	
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

MsgQueue.createWORKER("ArticleUpdate",5, function(worker, message){
	worker.ack()
	var data = JSON.parse(message.toString().trim())

	var query = {url: data.url}
	var updateData = data
	var curDate = new Date()

	updateData["lastUpdateAt"] = curDate
	updateData["$setOnInsert"] = {
		createAt: curDate
	}

	
	
	ArticleDB.findOneAndUpdate(query, data, {upsert:true}, function(){

	})
	
	


})