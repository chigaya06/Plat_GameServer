'use strict';

var fs = require('fs');
var CommandList = require(__dirname + "/../../config/commandCode.json").server2client;

var generatorList = {};

function Init(){
	for(var key in CommandList){
		var val = CommandList[key];
		if(fs.existsSync(__dirname + "/command/generator/" + key + ".js")){
			generatorList[val] = require("./command/generator/" + key + ".js");
		}
	}
}

function generateData(cmd){
	return generatorList[cmd];
}

function getCmdNum(cmd){
	return Number(CommandList[cmd]);
}

module.exports = function(obj){
	let cmd = getCmdNum(obj.cmd);

	var generator = generateData(cmd);

	var buffer;
	if(typeof generator === 'undefined'){
		var buffer = new Buffer(2);
		buffer.writeInt8(0, 1);
	} else {
		var buffer = generator(obj);
	}

	buffer.writeInt8(cmd, 0);

	return buffer;
}

Init();