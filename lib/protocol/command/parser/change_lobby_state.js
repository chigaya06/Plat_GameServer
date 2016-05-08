module.exports = function(buffer, obj){
	var state = buffer.readInt8(0);

	obj["state"] = getState(state);
}

function getState(num){
	return {
		"0" : "wait"
		,"1" : "ready"
	}[num]
}