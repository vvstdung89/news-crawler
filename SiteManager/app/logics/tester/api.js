var tester = require("./tester")
module.exports = {
	article_pattern: article_pattern,
	article_processor: article_processor
}

function reply(res, err, message){
	if (err) {
		res.json({status: "fail", msg: message})
	} else {
		res.json({status: "ok", msg: message})
	}
}

function article_pattern(req, res){	
	var body = req.body
	var pattern = body.pattern
	var rootUrl = body.root_url
	var testUrl = body.test_url

	tester.article_pattern(testUrl, rootUrl, pattern, function(err, data){
		if (err) return reply(res, true, err.message)
		reply(res, false, "Found " + data.length + " articles")
	})

}	

function article_processor(req, res){	
	var body = req.body
	var pattern = JSON.parse(body.pattern)
	var testUrl = body.test_url

	tester.article_processor(testUrl, pattern, function(err, data){
		if (err) return reply(res, true, err.message)
		console.log(data)
		reply(res, false, data)
	})

}	