var cheerio = require("cheerio")
var Parser = function(){}

module.exports = new Parser()

Parser.prototype.parseURL = function(content, patterns, rootURL){
	var $ = cheerio.load(content)
	var urlList = $("a").toArray()
	var matchURL = []
	for (var i = 0; i < urlList.length; i++){
		var href = $(urlList[i]).attr("href")
		if (!href) continue;

		href = href.trim()
		if (href && href.indexOf("/")==0){
			href = rootURL + href
		}

		href = href.trim()
	
		for (var j in patterns){
			var regex = new RegExp(patterns[j])
			var match = href.match(regex)
			if (match){
				matchURL.push(href)
				break;
			}
		}
	}

	return matchURL.filter(function(item, pos) {
	    return matchURL.indexOf(item) == pos;
	})

}
