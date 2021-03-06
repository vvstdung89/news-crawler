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

	processSeedTime: {type: Date, index: true},
	processArticleTime: {type: Date, index: true},

	todayArticle: {type: Number, index: true, default: 0, init: true},
	errorSeed: {type: Number, index: true, default: 0, init: true},
	successArticle: {type: Number, index: true, default: 0, init: true},
	articleGetError: {type: Number, index: true, default: 0, init: true},
	articleParseError: {type: Number, index: true, default: 0, init: true},


	systemDelayMin: {type: Number, index: true, default: 0, init: true},
	systemDelayMax: {type: Number, index: true, default: 0, init: true},
	systemDelayAvg: {type: Number, index: true, default: 0, init: true},

	insertDelayMin: {type: Number, index: true, default: 0, init: true},
	insertDelayMax: {type: Number, index: true, default: 0, init: true},
	insertDelayAvg: {type: Number, index: true, default: 0, init: true},

});

SiteConfig.set('autoIndex', true);

var DBModel = mongoose.model('site', SiteConfig);
var DBAccessAPI = require("./Base")(DBModel)

exports = module.exports = DBAccessAPI
