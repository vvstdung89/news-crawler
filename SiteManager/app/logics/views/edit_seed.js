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

	SiteDB.DBModel.findOneAndUpdate({
		_id: siteID
	}, {
		"article_pattern.pattern_match" : pattern
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
		getSeedUrls: ["siteInfo", function(results, callback){
			var siteInfo = results.siteInfo
			UrlDB.DBModel.find({domain: siteInfo.domain, type: "seed"})
			.lean()
			.exec(callback)
		}]
	}, function(err, results){

		var locals = {
			siteID: "",
			article_pattern: "",
			root_url: "",
			urlList: []
		}

		try {
			locals["siteID"] = results.siteInfo._id
			locals["domain"] = results.siteInfo.domain
			locals["root_url"] = results.siteInfo.root_url
			locals["article_pattern"] = results.siteInfo.article_pattern.pattern_match || ""
		} catch(err){}
		
		try {
			locals["urlList"] = results.getSeedUrls.map(function(x){
				return {
					id: x._id,
					url: x.url,
					status: x.processSeed ?  x.processSeed.status : "initial"
				}
			})
			locals["urlList"].sort(function(a,b){
				if (status=="error") return -1
				return 1				
			})
			
		} catch(err){}
		res.render("edit_seed", locals)
	})
	
	
}