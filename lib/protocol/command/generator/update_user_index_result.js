'use strict';

module.exports = function(obj){
	let bufferLen = 3;

	var buffer = new Buffer(bufferLen);

	buffer.writeInt8(1, 1);
	buffer.writeInt8(Number(obj.index), 2);

	return buffer;
}