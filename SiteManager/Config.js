var SERVICE_NAME = process.env["NAME"] || "SiteManager"
var NODE_ENV = process.env["NODE_ENV"] || "development"
var PORT = process.env["PORT"] || 14000

var Config = {
	DOMAIN: "",
	SERVICE_NAME: SERVICE_NAME,
	PORT: PORT,
	NODE_ENV: NODE_ENV,
	REDIS: "",
	MONGO: "mongodb://localhost:27017/News",
	RABBITMQ: "amqp://admin:admin@localhost:15672"
}

Object.defineProperty(global, '__Config', {
	get: function() {
        return Config;
    }
});

exports = module.exports = {}
