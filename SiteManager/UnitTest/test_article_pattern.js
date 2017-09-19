var tester = require("../app/logics/tester/tester").article_pattern


var testUrl = "http://tuoitre.vn"
var rootUrl = "http://tuoitre.vn"
var pattern = '^(http(s)?://)?tuoitre.vn/.*?(\\d{4,})(.html|.htm)$'

tester(testUrl,rootUrl, pattern, function(err, data){
	console.log(err || data)
})
