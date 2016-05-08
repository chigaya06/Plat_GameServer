'use strict'

let command = {
	"join" : require("./command/join.js")
	,"broadcast" : require("./command/broadcast.js")
	,"send_host" : require("./command/send_host.js")
	,"send_target" : require("./command/send_target.js")
	,"start_game" : require("./command/relay_all_simple.js")
	, "end_game" : require("./command/relay_all_simple.js")
	, "restart_game" : require("./command/relay_all_simple.js")
	, "result_game" : require("./command/relay_all_simple.js")
	, "max_user_set" : require("./command/max_user_set.js")
	, "get_user_list" : require("./command/get_user_list.js")
	, "premium_user" : require("./command/premium_user.js")
	, "update_ready_count" : require("./command/update_ready_count.js")
	, "change_lobby_state" : require("./command/change_lobby_state.js")
}

exports.join = command.join

exports.process = function(data){
	console.log("Start Process" , data.cmd)
	if(typeof command[data.cmd] !== 'undefined'){
		return command[data.cmd](data)
	} else {
		console.log("Invalid Command ->", data.cmd )
	}
}