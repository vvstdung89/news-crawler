var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var ArticleDB   = new Schema({
	domain: {type: String, index: true},
	url: {type: String, unique: true},

	// article info
	text: String,
	title: String,
	publish_date: {type: Date, index: true},
	image: String,

	// other meta info
	createAt: {type: Date, index: true},
	lastUpdateAt: {type: Date, index: true},

});

ArticleDB.set('autoIndex', true);
ArticleDB.index({createAt: -1, domain: -1});

var DBModel = mongoose.model('article', ArticleDB);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
