//init configuration
require("./Config")


//start cluster
var cluster = require("cluster")
var os = require("os")

if (cluster.isMaster) {
	var cpus = Math.ceil(os.cpus().length / 2)
	// cpus=1
	for (var i =0; i < cpus; i++){
		cluster.fork()
	}

	//capture crash
	cluster.on("exit", function(worker, code){
		cluster.fork()
	})

	
} else {
	require("./server")
}