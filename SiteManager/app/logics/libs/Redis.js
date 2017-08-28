var redis = require('redis');

var Redis = function(){}

Redis.prototype.createClient = function(){
	var redis_client = redis.createClient({url: __Config.REDIS});
	redis_client.on('connect', function(){
	    console.log("Connected to Redis");
	});
	return redis_client;
}

exports = module.exports = new Redis();