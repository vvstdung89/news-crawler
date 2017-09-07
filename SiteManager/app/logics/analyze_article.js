var SiteDB = require("../models/Site")
var UrlDB = require("../models/Url")

var async = require("async")
module.exports = function(req, res){
	var siteID = req.params.siteID

	async.auto({
		siteInfo: function(callback){
			SiteDB.DBModel.findOne({_id: siteID}, callback)
		},
		getUrls: ["siteInfo", function(results, callback){
			var site = results.siteInfo
			UrlDB.DBModel.find({
				domain: site.domain, 
				$or: [
					{"processArticle.status": "invalid"},
					{"processArticle.status": "error"}
				]
			})
			.limit(100)
			.lean()
			.exec(callback)
		}]
	}, function(err, results){
		if (err) return res.end("Error " + err.message)
		res.render("analyze_article", results)	
	})
	
}