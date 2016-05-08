'use strict'

let redis = require("redis")
	,async = require("async")
	,SocketManager = require("../utilz/socketManager.js")
	,RedisManager = require("../utilz/RedisManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let redisManager = new RedisManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber
	let max_client = data.max_client

	redisManager.setMaxUser(roomNumber, max_client, (err) => {
		if(err)
			throw err
	})
}