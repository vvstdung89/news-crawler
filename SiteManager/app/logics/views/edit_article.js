var SiteDB = require("../../models/Site")
var UrlDB = require("../../models/Url")
var async = require("async")

module.exports = {
	index: index,
	update: update
}

function update(req, res){
	var siteID = req.params.siteID
	var pattern = req.body.pattern

	if (!pattern){
		return res.json({status:"fail", pattern: "Pattern cannot be empty"})
	}

	pattern = JSON.parse(pattern)
	console.log(pattern)
	
	SiteDB.DBModel.findOneAndUpdate({
		_id: siteID
	}, {
		"article_processor" : pattern
	}, function(err, obj){
		console.log(obj)
		if (err)
			return res.json({status:"fail", pattern: "Update database fail"})
		return res.json({status:"ok", pattern: "Update successfully"})
	})


}
function index(req, res){
	var siteID = req.params.siteID
	async.auto({
		siteInfo: function(callback){
			SiteDB.DBModel.findOne({_id: siteID}, callback)
		},
		getArticleUrls: ["siteInfo", function(results, callback){
			var siteInfo = results.siteInfo
			UrlDB.DBModel.find({
				domain: siteInfo.domain, 
				type: "article",
				$or: [
					{"processArticle.status": "error"},
					{"processArticle.status": "invalid"}
				]
			})
			.limit(10)
			.lean()
			.exec(callback)
		}]
	}, function(err, results){

		var locals = {
			siteID: "",
			urlList: []
		}

		try {
			locals["siteID"] = results.siteInfo._id
			locals["domain"] = results.siteInfo.domain
			locals["processor"] = results.siteInfo.article_processor || {}
			if (!locals["processor"].title) {
				locals["processor"].title = {}
			}
			if (!locals["processor"].text) {
				locals["processor"].text = {}
			}
			if (!locals["processor"].publish_date) {
				locals["processor"].publish_date = {}
			} else {
				locals["processor"].publish_date.replaces = JSON.stringify(locals["processor"].publish_date.replaces || [], true, 4)
			}

		} catch(err){}
		
		try {
			locals["urlList"] = results.getArticleUrls.map(function(x){
				return {
					id: x._id,
					url: x.url,
					status: x.processArticle.status
				}
			})
			locals["urlList"].sort(function(a,b){
				if (status=="invalid") return -2
				if (status=="error") return -1
				return 1				
			})
			
		} catch(err){}

		
		res.render("edit_article", locals)
	})
	
	
}