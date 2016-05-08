'use strict';

module.exports = function(obj){
	let userListLen = obj.user_list.length;
	let bufferLen = 7 + (userListLen * 4);

	var buffer = new Buffer(bufferLen);

	buffer.writeInt8(bufferLen - 2, 1);
	buffer.writeInt32LE(Number(obj.uuid), 2);
	buffer.writeInt8(obj.user_list.length, 6);

	for(var i = 0; i < userListLen; i++){
		buffer.writeInt32LE(Number(obj.user_list[i]), 7 + (i*4));
	}

	return buffer;
}