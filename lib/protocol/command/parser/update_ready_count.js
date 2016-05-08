module.exports = function(buffer, obj){
	var ready = buffer.readInt8(0);
	var total = buffer.readInt8(1);

	obj["ready"] = ready;
	obj["total"] = total;
}