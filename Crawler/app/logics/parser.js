var cheerio = require("cheerio")
var moment = require("moment")
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

		if (href && href.indexOf("http")!=0){
			href = "http://" + href
		}

		href = encodeURI(href.trim())
	
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


function parseField($, processor){
	var obj = {}
	for (var field in processor){
		var props = processor[field]
		
		if (!props.selector) return {}
		var selector = props.selector
		var remove = props.remove
		var attribute = props.attribute
		var replaces = props.replaces
		var type = props.type || "string"

		var content = $(selector).eq(0)

		var text = ""
		if (remove){
			content.find(remove).remove()
		}

		if (attribute){
			text = content.attr(attribute)
		} else {
			text = content.text()
		}
				
		text = text.replace(/\t/g, ' ')
        text = text.replace(/((\r)*\n\s*)+/g, ' \n')
        text = text.replace(/\s{2,}/g, ' ')

        if (replaces){
        	replaces.map(function(config){
	        	if (!config.isExpression && !config.isRegx) {
	                text = text.replace(new RegExp(config.from, 'g'), config.to);
	            }

	            if (config.isRegx && text.match(config.from)) {
	                text = text.replace(new RegExp(config.from), config.to);
	            }

	        	if (config.isExpression){
	        		text = text.replace(new RegExp(config.from, 'g'), eval(config.to));
	        	}
	        })
        }
	        
        text = text.trim()
	    if (type && type=="time") {
	    	text = parseTime(text, props)
	    }

        obj[field] = text
	}

	return obj
}

function parseTime(str, field){
	var dateTime;
    var matches;
    var datetimeFormat = 'YYYY-MM-DDTHH:mm:00';
    //TODO: consider timezone in moment

    if ((str.indexOf('AM') > -1) || (str.indexOf('PM') > -1)) {
        if (field.format.indexOf('A') === -1) {
            field.format += ' A';
        }
    }

    if (matches = str.match(/(\d+) (seconds|minutes|hours|days|weeks|months|years)/)) {
        dateTime = moment().subtract(parseInt(matches[1]), matches[2]);
        if (dateTime.isValid()) {
            str = dateTime.toDate();
        } else {
            str = '';
        }
    } else {
        dateTime = moment(str, field.format ? field.format : datetimeFormat);
        if (dateTime.isValid()) {
            str = dateTime.toDate();
        } else {
            str = '';
        }
    }

    return str
}


Parser.prototype.parseArticle = function(content, processor, diffbot){
	var $ = cheerio.load(content)

	if (!processor) return {}

	if (diffbot) {
		console.log("parse article with diffbot")
		return
	}
	var data = parseField($, processor)
	
	return data
}
