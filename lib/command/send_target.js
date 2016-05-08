'use strict'

let redis = require("redis")
	,SocketManager = require("../utilz/socketManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber
	let obj = {
		"cmd" : "data"
		,"sender" : data.uuid
		,"data" : data.data
	}

	let msg = generate(obj)

	socketManager.sendTo(data.target, msg)
}