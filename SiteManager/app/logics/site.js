var SiteDB = require("../models/Site")
var UrlDB = require("../models/Url")
var async = require("async")
var Busboy = require("busboy");

module.exports = {
	index: index,
	add: add,
	remove: remove,
	edit: edit,
	pause: pause,
	start: start,
	importFile: importFile
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
		UrlDB.createOrUpdate({domain: domain, url: root_url, type: "seed", priority: "slow", isEnable: false}, function(){})

		var newSite = SiteDB.DBModel({
			name: name,
			domain: domain,
			root_url: root_url,
			isEnable: false
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

function pause(req, res){
	var id = req.body.id
	if (!id) {
		res.status(500)
		return res.json({status:"fail", msg:"Invalid data"})
	}

	async.auto({
		getSite: function(callback){
			SiteDB.DBModel.findOne({_id:id})
			.exec(callback)
		},
		updateUrl: ["getSite", function(results, callback){
			var site = results.getSite
			UrlDB.DBModel.update({domain: site.domain}, {isEnable: false}, {multi:true}, callback)
		}],
		updateSite: ["updateUrl", function(results, callback){
			SiteDB.DBModel.update({_id:id}, {isEnable: false}, callback)
		}],
	}, function(err){
		if (err){
			res.json({status:"fail"})
		} else {
			res.json({status:"ok"})
		}
	})
}

function start(req, res){
	var id = req.body.id
	if (!id) {
		res.status(500)
		return res.json({status:"fail", msg:"Invalid data"})
	}

	async.auto({
		getSite: function(callback){
			SiteDB.DBModel.findOne({_id:id})
			.exec(callback)
		},
		updateUrl: ["getSite", function(results, callback){
			var site = results.getSite
			UrlDB.DBModel.update({domain: site.domain}, {isEnable: true}, {multi:true}, callback)
		}],
		updateSite: ["updateUrl", function(results, callback){
			SiteDB.DBModel.update({_id:id}, {isEnable: true}, callback)
		}],
	}, function(err){
		if (err){
			res.json({status:"fail"})
		} else {
			res.json({status:"ok"})
		}
	})
}


function importFile(req, res){
	var busboy = new Busboy({ headers: req.headers });
	var endFile = false
	var fileData = ""

	busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
		
		console.log('File [' + fieldname + ']: filename: ' + filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);

		file.on('data', function(data) {
			console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
			fileData += data.toString()
		});

		file.on('end', function() {
			console.log('File [' + fieldname + '] Finished');
		});

	});

	busboy.on('finish', function() {
		console.log(fileData)
		var jsonData = IsJsonString(fileData)

		if (jsonData){
			var name = jsonData.site_name
			var root_url = jsonData.domain.replace(/\/$/,"")
			var domain = getDomain(root_url)

			var priority = "medium"
			var isEnable = false

			if (jsonData.article_processor.created_time){
				jsonData.article_processor.created_time.type = "time"
			}

			var article_pattern = jsonData.url_processor
			var use_diffbot= jsonData.use_diffbot || false

			var article_processor = {
				title: jsonData.article_processor.title,
				text: jsonData.article_processor.text,
				publish_date: jsonData.article_processor.created_time,
				
			}

			if (typeof jsonData.article_processor.title == "string"){
				article_processor.title = {"selector": jsonData.article_processor.title}
			}

			if (typeof jsonData.article_processor.text == "string"){
				article_processor.text = {"selector": jsonData.article_processor.text}
			}


			var siteData = { 
					name:name, 
					domain:domain, 
					root_url:root_url, 
					priority:priority, isEnable:isEnable, 
					article_pattern: article_pattern, 
					use_diffbot: use_diffbot, 
					article_processor:article_processor
			 }

			SiteDB.createOrUpdate({domain:domain}, siteData, function(){

			})
			

			if (jsonData.seed_urls){
				jsonData.seed_urls.map(function(seed_url){
					UrlDB.createOrUpdate({domain: domain, url: seed_url, type: "seed"}, {domain: domain, url: seed_url, type: "seed", priority: "medium", isEnable: false}, function(){})	
				})
			}
			

			console.log(siteData)
		}
		res.end()
	});

	req.pipe(busboy);
}

function IsJsonString(str) {
    try {
        var json = JSON.parse(str);
    } catch (e) {
        return false;
    }
    return json;
}