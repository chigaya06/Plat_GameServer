module.exports = function(buffer, obj){
	var max_client = buffer.readInt8(0);

	obj["max_client"] = max_client;
}