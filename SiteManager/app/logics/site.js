var SiteDB = require("../models/Site")
var UrlDB = require("../models/Url")


module.exports = {
	index: index,
	add: add,
	remove: remove,
	edit: edit
}

function index(req, res){
	var siteList = []
	SiteDB.list({}, 0, 100, {}, function(err, data){
		if (err) return res.end("Database access error")
		res.render("site", {siteList:data})
	})
}


function getDomain(url){
	var regex = /(?:http:\/\/|htts:\/\/)([^\/]*)/
	var match = regex.exec(url)
	if (match) return match[1]
	else return null
}

function add(req, res){
	console.log(req.body)

	var name = req.body.name
	var root_url = req.body.root_url
	var domain = getDomain(root_url)

	if (name && root_url) {
		UrlDB.createOrUpdate({domain: domain, url: root_url, type: "seed", seedWaitTime: 300}, function(){})

		var newSite = SiteDB.DBModel({
			name: name,
			domain: domain,
			root_url: root_url
		})

		newSite.save(function(err){
			if (err) {
				res.status(500)
				res.json({status:"fail", msg:err.message})
			} else {

				res.json({status:"ok"})
			}
		})
	} else {
		res.status(500)
		res.json({status:"fail", msg:"Invalid data"})
	}
		
}

function remove(req, res){
	var id = req.body.id
	if (!id) {
		res.status(500)
		return res.json({status:"fail", msg:"Invalid data"})
	}
	SiteDB.remove({_id: id}, function(err){
		if (err) {
			res.status(500)
			res.json({status:"fail", msg:err.message})
		} else {
			res.json({status:"ok"})
		}
	})
}

function edit(req, res){
	var data = {}
	if (req.body.seed_url_pattern){
		var seed_url_pattern = req.body.seed_url_pattern.split("\n")
		data.seed_url_pattern = seed_url_pattern
	}

	if (req.body.article_processor){
		var article_processor = req.body.article_processor
		var parseError = false
		try {
			 JSON.parse(article_processor)	
			 data.article_processor = article_processor
		} catch(err){
			console.log(err)
			parseError = true
		}
		if (parseError){
			res.status(500)
			res.json({status:"fail", msg:"json parse error"})
			return
		}
	}

	var id = req.body.id
	SiteDB.update({_id: id},data, function(err){
		if (err) {
			res.status(500)
			res.json({status:"fail", msg:err.message})
		} else {
			res.json({status:"ok"})
		}
	})
}