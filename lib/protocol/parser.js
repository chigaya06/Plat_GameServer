var fs = require('fs');
var CommandNumber = require(__dirname + "/../../config/commandCode.json").client2server;

var parserList = {};

function Init(){
	for(var key in CommandNumber){
		var val = CommandNumber[key];
		parserList[val] = require("./command/parser/" + val + ".js");
	}
}

function parseData(cmd){
	return parserList[cmd];
}

function getCmd(cmd){
	return CommandNumber[cmd];
}

module.exports = function(buffer){
	var cmd = getCmd(buffer.readInt8(0));
	var roomNumber = buffer.readUInt16LE(1); // typeof socket.room !== "undefined" ? socket.room ||
	var uuid = buffer.readInt32LE(3); // typeof socket.uuid !== "undefined" ? socket.uuid || 

	var length = buffer.readInt8(7);

	var obj =  {
		cmd : cmd
		,roomNumber : roomNumber
		,uuid : uuid
	};

	parseData(cmd)(buffer.slice(8, 8+length), obj);

	return {
		next_buffer : buffer.slice(8+length)
		,prev_buffer : buffer.slice(0, 8+length)
		,data : obj
	};
}

Init();