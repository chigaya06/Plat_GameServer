'use strict'

let redis = require("redis")
	,async = require("async")
	,SocketManager = require("../utilz/socketManager.js")
	,RedisManager = require("../utilz/RedisManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()
let redisManager = new RedisManager()

module.exports = function(data) {
	let roomNumber = data.roomNumber

	redisManager.getRoomMembers(roomNumber, (err, result) => {
		if(err){
			throw err
		} else {
			let obj = {
				"cmd" : "get_user_list_result"
				,"user_list" : result.clients
			}

			let msg = generate(obj)

			socketManager.send(data.uuid, msg)
		}
	})
}