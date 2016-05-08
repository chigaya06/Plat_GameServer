module.exports = function(buffer, obj){
	var data = buffer.toString("utf-8");

	obj["data"] = data;
}