module.exports = function(buffer, obj){
	var index = buffer.readInt8(0);

	obj["index"] = index;
}