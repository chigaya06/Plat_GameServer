'use strict';

/**
DATA
ack(16bit), is_host(8bit), user_list(?), u_code(16bit)

obj에 반드시 존재하는 필드 : ack

is_host 는 없으면 무조건 true

user_list 는 없으면 list_len 0처리

u_code 없으면 0 처리
**/

module.exports = function(obj){
	let userListLen = Array.isArray(obj.user_list)?obj.user_list.length:0;
	var bufferLen = 1 + 1 + 2 + 1 + 1  + (userListLen * 4);

	var buffer = new Buffer(bufferLen);

	var ack = obj.ack;
	var is_host = obj.is_host;
	var user_list = obj.user_list;
	var uuid = obj.uuid;

	buffer.writeInt8(bufferLen - 2, 1);
	buffer.writeInt16LE(Number(ack), 2);

	if(is_host){
		buffer.writeInt8(1,4);
	} else {
		buffer.writeInt8(is_host?1:0, 4);
	}

	buffer.writeInt8(userListLen, 5);

	for(var i = 0; i < userListLen; i++){
		buffer.writeInt32LE(Number(user_list[i]), 6 + (i*4));
	}

	return buffer;
}