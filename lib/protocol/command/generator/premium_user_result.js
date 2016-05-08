'use strict';

module.exports = function(obj){
	let bufferLen = 6;

	var buffer = new Buffer(bufferLen);

	buffer.writeInt8(4, 1);
	buffer.writeInt32LE(Number(obj.uuid), 2);

	return buffer;
}