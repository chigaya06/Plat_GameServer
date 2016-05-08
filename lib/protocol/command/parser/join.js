module.exports = function(buffer, obj){
	var type, name;
	var ishost = buffer.readInt8(0);
	var max_user = buffer.readInt8(1);
	var package_name = buffer.slice(2).toString("utf-8");

	obj["max_user"] = max_user;
	obj["package_name"] = package_name;

	if(ishost){
		type = "host";
		name = "host";
	} else {
		type = "user";
		name = "";
	}

	obj["type"] = type;
	obj["name"] = name;
}