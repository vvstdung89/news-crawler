var UrlDB = require("../../models/Url").DBModel
var ArticleDB = require("../../models/Article").DBModel
var SiteDB = require("../../models/Site").DBModel

var todayArticle, errorSeed, successArticle, errorArticle, systemDelay, insertDelay

module.exports = function(){

}

function updateStat(){
	for (var key in todayArticle){
		var data = {
			todayArticle : todayArticle[key]
		}
		SiteDB.update({domain: key}, data, function(){})
	}

	for (var key in errorSeed){
		var data = {
			errorSeed : errorSeed[key]
		}
		SiteDB.update({domain: key}, data, function(){})
	}

	for (var key in successArticle){
		var data = {
			successArticle : successArticle[key]
		}
		SiteDB.update({domain: key}, data, function(){})
	}

	for (var key in errorArticle){
		var data = {
			articleGetError : errorArticle[key]["error"] || 0,
			articleParseError : errorArticle[key]["invalid"] || 0
		}
		SiteDB.update({domain: key}, data, function(){})
	}


	for (var key in systemDelay){
		var data = {
			systemDelayMin : systemDelay[key]["min"] || 0,
			systemDelayMax : systemDelay[key]["max"] || 0,
			systemDelayAvg : systemDelay[key]["avg"] || 0,
		}
		SiteDB.update({domain: key}, data, function(){})
	}

	for (var key in insertDelay){
		var data = {
			insertDelayMin : insertDelay[key]["min"] || 0,
			insertDelayMax : insertDelay[key]["max"] || 0,
			insertDelayAvg : insertDelay[key]["avg"] || 0,
		}
		SiteDB.update({domain: key}, data, function(){})
	}

	setTimeout(updateStat, 60*1000)
}

var insertDelayTime = 5*60*1000
var systemDelayTime = 5*60*1000
var seedStatTime = 5*60*1000
var todayArticleStatTime = 5*60*1000
var errorArticleStatTime = 5*60*1000
var successArticleStatTime = 5*60*1000

function seedStat(){

	UrlDB.aggregate([
		{
			$match: {
				type: "seed",
				"processSeed.status": "error"
				
			}
		}, {
			$group: {
				_id: "$domain",
				total: {
					$sum: 1
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id] = x.total
			})
			errorSeed = tmp
		}
		console.log("errorSeed" , errorSeed)
		setTimeout(seedStat, seedStatTime)
	})
}

function todayArticleStat(){
	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setMilliseconds(0)

	UrlDB.aggregate([
		{
			$match: {
				type: "article",
				createAt: {$gt : today}
			}
		}, {
			$group: {
				_id: "$domain",
				total: {
					$sum: 1
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id] = x.total
			})
			todayArticle = tmp
		}
		console.log("todayArticle" , todayArticle)
		setTimeout(todayArticleStat, todayArticleStatTime)
	})
}


function errorArticleStat(){
	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setMilliseconds(0)

	UrlDB.aggregate([
		{
			$match: {
				type: "article",
				"processArticle.processAt": {$gt : today},
				$or: [
					{"processArticle.status": "invalid"},
					{"processArticle.status": "error"},
				]
			}
		}, {
			$group: {
				_id: {
					domain: "$domain",
					status: "$processArticle.status"
				},
				total: {
					$sum: 1
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id.domain] = {}
				tmp[x._id.domain][x._id.status] = x.total
			})
			errorArticle = tmp
			console.log("errorArticle", errorArticle)
		}
		setTimeout(errorArticleStat, errorArticleStatTime)
	})
}


function successArticleStat(){
	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setMilliseconds(0)

	UrlDB.aggregate([
		{
			$match: {
				type: "article",
				"processArticle.processAt": {$gt : today},
				"processArticle.status": "finish"
			}
		}, {
			$group: {
				_id: "$domain",
				total: {
					$sum: 1
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id] = {}
				tmp[x._id] = x.total
			})
			successArticle = tmp
			console.log("successArticle", successArticle)
		}
		setTimeout(successArticleStat, successArticleStatTime)
	})
}

function systemDelayStat(){
	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setMilliseconds(0)

	UrlDB.aggregate([
		{
			$match: {
				type: "article",
				"processArticle.processAt": {$gt : today},
				"processArticle.status": "finish"
			}
		}, {
			$group: {
				_id: "$domain",
				min: {
					$min: {
						$subtract: ["$processArticle.processAt", "$createAt"]
					}
				},
				max: {
					$max: {
						$subtract: ["$processArticle.processAt", "$createAt"]
					}
				},
				avg: {
					$avg: {
						$subtract: ["$processArticle.processAt", "$createAt"]
					}
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id] = {}
				tmp[x._id].min = Math.ceil(x.min/1000)
				tmp[x._id].max = Math.ceil(x.max/1000)
				tmp[x._id].avg = Math.ceil(x.avg/1000)
			})
			systemDelay = tmp
			console.log("systemDelay", systemDelay)
		}
		setTimeout(systemDelayStat, systemDelayTime)
	})
}



function insertDelayStat(){
	var today = new Date()
	today.setHours(0)
	today.setMinutes(0)
	today.setMilliseconds(0)

	ArticleDB.aggregate([
		{
			$match: {
				"createAt": {$gt : today}
			}
		}, {
			$group: {
				_id: "$domain",
				min: {
					$min: {
						$subtract: ["$createAt", "$publish_date"]
					}
				},
				max: {
					$max: {
						$subtract: ["$createAt", "$publish_date"]
					}
				},
				avg: {
					$avg: {
						$subtract: ["$createAt", "$publish_date"]
					}
				}
			}
		}
	])
	.exec(function(err, results){
		if (!err) {
			var tmp = {}
			results.map(function(x) {
				tmp[x._id] = {}
				tmp[x._id].min = Math.ceil(x.min/1000)
				tmp[x._id].max = Math.ceil(x.max/1000)
				tmp[x._id].avg = Math.ceil(x.avg/1000)
			})
			insertDelay = tmp
			console.log("insertDelay", insertDelay)
		} else console.log(err)
		setTimeout(insertDelayStat, insertDelayTime)
	})
}

errorArticleStat()
todayArticleStat()
successArticleStat()
seedStat()
systemDelayStat()
insertDelayStat()

setTimeout(updateStat, 10000)