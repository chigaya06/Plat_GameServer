'use strict'

let redis = require("redis")
	,SocketManager = require("../utilz/socketManager.js")
	,RedisManager = require("../utilz/RedisManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()
let redisManager = new RedisManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber
	let obj = {
		"cmd" : data.cmd + "_result"
	}
	let msg = generate(obj)

	socketManager.sendAll(roomNumber, msg)
}

let cmd_logic = function(cmd, roomNumber){
	let logic = {
		"start_game" : start_game
		,"end_game" : end_game
	}[cmd]

	if(typeof logic === 'function'){
		logic(roomNumber)
	}
}

let start_game = function(roomNumber){
	redisManager.setRoomStatus(roomNumber, "game")
}

let end_game = function(roomNumber){
	redisManager.setRoomStatus(roomNumber, "open")
}