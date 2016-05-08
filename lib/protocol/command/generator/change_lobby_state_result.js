'use strict';

module.exports = function(obj){
	let bufferLen = 7;

	var buffer = new Buffer(bufferLen);

	buffer.writeInt8(bufferLen - 2, 1);
	buffer.writeInt32LE(Number(obj.uuid), 2);
	
	if (obj.state === "ready"){
		buffer.writeInt8(1, 6);
	} else {
		buffer.writeInt8(0, 6);
	}

	return buffer;
}