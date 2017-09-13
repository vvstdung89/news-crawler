var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UrlList   = new Schema({
	domain: {type: String, index: true},
	url: {type: String, unique: true},
	type: {type: String, index: true}, //seed, article	
	priority: {type: String, index: true},
	createAt: {type: Date, index: true},

	lastUpdateAt: {type: Date, index: true},

	processSeed: {
		processAt: {type: Date, index: true},
		status: {type: String, index: true},
		msg: String,
		retry: Number
	},
	
	processArticle: {
		processAt: {type: Date, index: true},
		status: {type: String, index: true},
		msg: String,
		retry: Number
	}
});

UrlList.set('autoIndex', true);

//indexing get todayArticleStat
UrlList.index({createAt: 1, type: 1})
UrlList.index({createAt: 1, type: 1, domain: 1})

//indexing get articleErrorStat
UrlList.index({"processArticle.processAt": 1, type: 1, "processArticle.status": 1})
UrlList.index({"processArticle.processAt": 1, type: 1, "processArticle.status": 1, "domain": 1})


UrlList.index({domain: -1, type: 1, priority: 1, processSeed: -1, createAt: 1})
UrlList.index({domain: -1, type: 1, processArticle: -1, createAt: 1})

var DBModel = mongoose.model('url', UrlList);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
