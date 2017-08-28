var NODE_ENV = process.env["NODE_ENV"] || "development"

var Config = {
	NODE_ENV: NODE_ENV,
	REDIS: "",
	RABBITMQ: "",
	BACKEND: "http://localhost:14000",
	RABBITMQ: "amqp://admin:admin@localhost:15672"
}

Object.defineProperty(global, '__Config', {
	get: function() {
        return Config;
    }
});

exports = module.exports = {}
