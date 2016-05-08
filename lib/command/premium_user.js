'use strict'

let redis = require("redis")
	,SocketManager = require("../utilz/socketManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber
	let uuid = data.uuid

	let obj = {
		"cmd" : "premium_user_result"
		,"uuid" : uuid
	}

	let msg = generate(obj)

	socketManager.sendToHost(roomNumber, msg)
}