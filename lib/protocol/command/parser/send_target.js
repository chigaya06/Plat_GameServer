module.exports = function(buffer, obj){
	var arr_len = buffer.readInt8(0);
	var target = [];
	for(var i = 0; i < arr_len; i++){
		var offset = 1 + (i*4);
		target.push(buffer.readInt32LE(offset));
	}
	
	var data = buffer.slice(1 + (arr_len*4)).toString("utf-8");

	obj["target"] = target;
	obj["data"] = data;
}