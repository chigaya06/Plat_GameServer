module.exports = function(buffer, obj){
	var type;
	if(obj.u_code == -1){
		type = "host";
	} else {
		type = "user";
	}

	obj["type"] = type;
}