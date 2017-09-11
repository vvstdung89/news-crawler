var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var UrlList   = new Schema({
	domain: {type: String, index: true},
	url: {type: String, unique: true},
	type: String, //seed, article	
	priority: String,
	createAt: Date,
	lastUpdateAt: Date,

	processSeed: {
		processAt: Date,
		status: String,
		msg: String,
		retry: Number
	},
	
	processArticle: {
		processAt: Date,
		status: String,
		msg: String,
		retry: Number
	}
});

UrlList.set('autoIndex', true);
UrlList.index({domain: -1, type: 1, createAt: 1})
UrlList.index({type: -1, createAt: 1})
UrlList.index({domain: -1, type: 1, priority: 1, processSeed: -1, createAt: 1})
UrlList.index({domain: -1, type: 1, processArticle: -1, createAt: 1})

var DBModel = mongoose.model('url', UrlList);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
