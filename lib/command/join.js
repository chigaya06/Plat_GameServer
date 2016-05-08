'use strict'

let redis = require("redis")
	,async = require("async")
	,SocketManager = require("../utilz/socketManager.js")
	,RedisManager = require("../utilz/RedisManager.js")
	,generate = require("../protocol/generator.js")

// Instance Create
let socketManager = new SocketManager()
let redisManager = new RedisManager()

module.exports = function(socket, data){
	socketManager.addSocket(socket, data.uuid)

	socketManager.joinRoom(
		data.uuid
		, data.roomNumber
		, data.package_name
		, (data.type=="host"?true:false)
		, (err) => {
			if(err) {
				if(typeof err.cmd === 'undefined') {
					throw err
				} else {
					console.log(err)
					let msg = generate(err)
					socket.write(msg)
				}
			} else {
				// TODO : Join Result 처리
				redisManager.getRoomMembers(data.roomNumber, (err, members) => {
					if(err){
						throw err
					} else {
						let obj = {
							"cmd" : "join_result"
							,"ack" : 0
							,"uuid" : socket.uuid
							,"is_host" : socket.host
							,"package_name" : data.package_name
							,"user_list" : members.clients 
						}

						//console.log(obj)

						let msg = generate(obj)

						socketManager.send(data.uuid, msg)

						if(!socket.ishost) {
							async.parallel({
								"user_add" : (cb) => {
									let obj = {
										"cmd" : "user_add"
										,"uuid" : socket.uuid
										,"user_list" : members.clients 
									}

									let msg = generate(obj)

									socketManager.sendToHost(data.roomNumber, msg)
								}
								,"update_user_index_result" : (cb) => {
									for(let index in members.clients) {
										let uuid = members.clients[index]

										let obj = {
											"cmd" : "update_user_index_result"
											,"ack" : 0
											,"uuid" : uuid
											,"roomNumber" : data.roomNumber
											,"index" : index
										}

										let msg = generate(obj)

										socketManager.send(uuid, msg)
									}
								}
							})
						}
					}
				})
			}
		}
	)
	// uuid 등록 - Clear
	// SocketManager 에 추가 - Clear
	// roomNumber 유효 확인 - Clear
	// 방 상태 확인 - Clear
	// pacakge 일치 확인 - Clear
	// host 여부 에 따라
	// Host 인 경우
		// 현재 이미 호스트가 있는지 확인 - Clear
		// ERROR 생성 - Clear
		// Redis에 데이터 추가 - Clear
	// Host가 아닌 경우
		// 이미 특정 방에 접속해있는지 확인 - Clear
		// ERROR 생성 - Clear
		// Redis에 데이터 추가 - Clear
	// join_result 처리 - Clear
}