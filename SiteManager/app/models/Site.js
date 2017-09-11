var mongoose     = require('mongoose');
var Schema       = mongoose.Schema;

var SiteConfig   = new Schema({
	name: String,
	domain: {type: String, unique: true},
	root_url: String,

	priority: String, //slow, medium, high
	article_pattern : Schema.Types.Mixed, 
	use_diffbot: Boolean,
	isEnable: {type: Boolean, index: true, default: false}, 
	article_processor: Schema.Types.Mixed,

	processSeedTime: {type: Date, unique: true}
});

SiteConfig.set('autoIndex', true);

var DBModel = mongoose.model('site', SiteConfig);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
