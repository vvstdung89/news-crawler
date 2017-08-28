
exports = module.exports = function(DBModel){
	return new BaseModel(DBModel)
}

var BaseModel = function(DBModel){
	this.DBModel = DBModel
}

BaseModel.prototype.create = function(query, callback){
	var newRecord = new this.DBModel(query)
	newRecord.save(callback)

}

BaseModel.prototype.update = function(query, update, callback){
	this.DBModel.findOneAndUpdate(query, update, {new: true}, callback)
}

BaseModel.prototype.get = function(query, options, callback){
	if (typeof options=="function"){
		this.DBModel.findOne(query, options)	
	} else {
		this.DBModel.findOne(query, options, callback)
	}
	
}	

BaseModel.prototype.remove = function(query, callback){	
	this.DBModel.remove(query, callback)
}

BaseModel.prototype.list = function(query, from, size, sort, callback){
	
	this.DBModel.find(query || {})
	.skip(from || 0)
	.limit(size || 10)
	.sort(sort || {})
	.lean()
	.exec(callback)
}

BaseModel.prototype.createOrUpdate = function(query, update, callback){
	if (typeof update == "function"){
		this.DBModel.findOneAndUpdate(query, query, {upsert: true, new: true}, update)	
	} else {
		this.DBModel.findOneAndUpdate(query, update, {upsert: true, new: true}, callback)
	}
}



