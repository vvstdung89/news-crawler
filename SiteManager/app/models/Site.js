var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SiteConfig   = new Schema({
	name: String,
	domain: {type: String, unique: true},
	root_url: String,

	priority: String, //slow, medium, high
	seed_url_pattern : Schema.Types.Mixed, //array of regex pattern

	article_processor: {
		url_pattern: String,
		title: String,
		image: String,
		content: String,
		created_time: Schema.Types.Mixed,
	},
	process_seed_status: String,
	process_article_status: String,
});

SiteConfig.set('autoIndex', true);

var DBModel = mongoose.model('site', SiteConfig);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
