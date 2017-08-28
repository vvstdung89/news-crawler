var connected = false;
var PUBs = {};
var PUB_READY = {}

var QueueManager = function(){
	this.context = require('rabbit.js').createContext(__Config.RABBITMQ);
	__Logger.debug("try connect " + __Config.RABBITMQ)
	this.context.on('ready', function() {
		__Logger.info("Connected to rabbitmq")
		connected = true;
	})
}

QueueManager.prototype.createREQUEST = function(topic, callback){
	var self = this;
	if (connected){
		if (!PUBs[topic]){
			var PUB = self.context.socket("REQUEST");
			PUB.connect(topic);		
			PUB.on("data",callback)
			PUBs[topic] = PUB
			setTimeout(function(){
				PUB_READY[topic] = true
			},3000)
		}
	} else {
		setTimeout(function(){
			self.createREQUEST(topic, callback)
		},100)
	}
	
}

QueueManager.prototype.createREPLY = function(topic, prefetch, callback){

	var SUB = this.context.socket("REPLY", {prefetch: prefetch});
	SUB.connect(topic)
	SUB.setEncoding('utf8');
	__Logger.info("create REPLY " + topic)
	SUB.on('data', function(data) { 
		callback(SUB, data)
	})
}

QueueManager.prototype.createPUSH = function(topic){
	var self = this;
	
	if (connected){
		if (!PUBs[topic]){
			var PUB = this.context.socket("PUSH");
			PUB.connect(topic);		
			PUBs[topic] = PUB
			setTimeout(function(){
				PUB_READY[topic] = true
			},3000)
		}
	} else {
		setTimeout(function(){
			self.createPUSH(topic)
		},100)
	}
	
	
}

QueueManager.prototype.createWORKER = function(topic, prefetch, callback){
	var SUB = this.context.socket("WORKER", {prefetch: prefetch});
	SUB.connect(topic)
	SUB.setEncoding('utf8');
	__Logger.info("create WORKER " + topic)
	SUB.on('data', function(data) { 
		callback(SUB, data)
	})
}

QueueManager.prototype.send = function(topic, message) {
	var self = this;
	if (connected)	 {
		if (PUBs[topic] && PUB_READY[topic]){
			PUBs[topic].write(message)
		} else {
			setTimeout(function(){
				if (PUBs[topic] && PUB_READY[topic] ){
					PUBs[topic].write(message)
				} else {
					__Logger.error("Something wrong for submit task " + topic)
				}
			},5000)
		}
	} else {
		setTimeout(function(){
			self.send(topic, message)
		},100)
	}

	
}

exports = module.exports = new QueueManager()