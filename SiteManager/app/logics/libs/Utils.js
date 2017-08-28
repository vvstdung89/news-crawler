var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
var execSync = require('child_process').execSync;
var exec = require('child_process').exec;
var ip_hash  = "";
var ip = "";
var fs = require('fs');
var crypto = require('crypto'),
	algorithm = 'aes-256-ctr'
var zlib = require('zlib');

var self = this

exports = module.exports = {
	isValidUrl: function (url){
		return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(url);
	},

	isValidEmail: function (email){
		var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
		return re.test(email);
	},

	isSupportVideoLink: function (url){
		if (!this.isValidUrl(url))  return false;
		return true;
	},

	getUID: function(){
		var uuid = require('node-uuid');
		return ip_hash + "-"+ uuid.v1();
	},

	getIP: function(){
		if (!ip){
			ip = execSync('curl -s "ipv4.google.com/sorry/index" | grep -oE "([0-9]{1,3}\\.){3}[0-9]{1,3}"').toString();
			shasum.update(ip.replace(/\./g,""));
			ip_hash = shasum.digest('hex');
			__Logger.info("Public IP: " + ip)
			return ip;
		} else {
			return ip;
		}
	},

	parseCookies: function( request) {
	    var list = {},
	        rc = request.headers.cookie;
	    rc && rc.split(';').forEach(function( cookie ) {
	        var parts = cookie.split('=');
	        list[parts.shift().trim()] = decodeURI(parts.join('='));
	    });
	    return list;
	},

	mkdirs: function(dir){
		if (!fs.existsSync(dir)){
		    fs.mkdirSync(dir);
		}
	},

	parseCookies: function(request) {
	    var list = {},
	        rc = request.headers.cookie;
	    rc && rc.split(';').forEach(function( cookie ) {
	        var parts = cookie.split('=');
	        list[parts.shift().trim()] = decodeURI(parts.join('='));
	    });
	    return list;
	},

	encrypt: function(binary, password){
		var cipher = crypto.createCipher(algorithm,password)
		var crypted = cipher.update(binary,'binary','hex')
		crypted += cipher.final('hex');
		return crypted;
	}, 

	decrypt: function(binary, password){
		var decipher = crypto.createDecipher(algorithm,password)
		var dec = decipher.update(binary,'hex','binary')
		dec += decipher.final('binary');
		return dec;
	},
	genEmbedLink: function(info, password, callback){
		zlib.Z_DEFAULT_COMPRESSION = 5;
		var objStr = JSON.stringify(info)
		zlib.gzip(objStr, function (_, result) {  // The callback will give you the 
			var cipher = crypto.createCipher(algorithm,password)
			var encryptUrl = cipher.update(result,'binary','hex')
			
			encryptUrl += cipher.final('hex');
			
		  	callback(encryptUrl)
		});
	},
	randomString: function(number){
		var text = "";
		var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

		for( var i=0; i < number; i++ )
			text += possible.charAt(Math.floor(Math.random() * possible.length));

		return text;
	}

}
