'use strict';

module.exports = function(obj){
	let bufferLen = 4;

	var buffer = new Buffer(bufferLen);

	buffer.writeInt8(2, 1);
	buffer.writeInt8(Number(obj.ready), 2);
	buffer.writeInt8(Number(obj.total), 3);

	return buffer;
}