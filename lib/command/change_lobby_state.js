'use strict'

let redis = require("redis")
	,SocketManager = require("../utilz/socketManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber

	let obj = {
		"cmd" : "change_lobby_state_result"
		,"roomNumber" : roomNumber
		,"uuid" : data.uuid
		,"state" : data.state
	}

	let msg = generate(obj)

	console.log(obj, msg)
	socketManager.sendToHost(roomNumber, msg)
}