'use strict'
/**
 * 소켓 관리자
 */

// Module Load
let RedisManager = require("./RedisManager.js")
	,generate = require("../protocol/generator.js")

let instance = null

class SocketManager {
	constructor(pid) {
		if (!instance) {
			instance = this
		}

		this._sockets = new Map()
		this.redis = new RedisManager(pid)

		return instance
	}

	/**
	 * unique_id 로 특정 소켓 가져오기
	 *
	 * @param uuid {string} 대상의 Socket Unique ID
	 *
	 * @return {Socket} Unique ID와 일치하는 Socket
	 */
	getSocket(uuid) {
		uuid = Number(uuid)
		if(this._sockets.has(uuid)) {
			return this._sockets.get(uuid)
		} else {
			return null
		}
	}

	/**
	 * Socket을 매니저에 추가
	 *
	 * @param socket {Socket} 추가할 소켓
	 * @param uuid {string} 소켓 유니크 키
	 * @param cb {function} CallBack 함수
	 */
	addSocket(socket, uuid, cb) {
		if(typeof socket !== 'object'){
			// ERROR_TODO : thorw Error 추가
		}

		socket["uuid"] = uuid
		this._sockets.set(uuid, socket)

		this.redis.addSocketId(uuid)

		if(typeof cb === 'function'){
			cb(socket)
		}
	}

	/**
	 * Socket을 매니저에서 삭제
	 *
	 * @param uuid {string} 소켓 유니크 키
	 * @param cb {function} CallBack 함수
	 */
	removeSocket(uuid, cb) {
		let socket = this.getSocket(uuid)

		if(socket !== null) {
			this._sockets.delete(uuid)
			this.redis.removeSocketId(uuid)
		}

		if(typeof cb === 'function'){
			cb()
		}
	}

	/**
	 * 소켓의 연결이 종료 되었을때 처리부분
	 *
	 * @param socket {Socket} 소켓 오브젝트
	 * @param cb {function} Callback Function
	 */
	disconnect(socket, cb) {
		this.removeSocket(socket.uuid, () => {
			if(typeof socket.room !== 'undefined') {
				this.leaveRoom(socket.uuid, socket.room, socket.ishost, () => {
					if(socket.ishost){
						let leaveMessage = generate({cmd : "host_close"})
						this.sendAll(socket.room, leaveMessage)

						if(typeof cb === 'function')
							cb()
					} else {
						this.redis.getRoomMembers(socket.room, (err, result) => {
							if(err) {
								if(typeof cb === 'function')
									cb(err)
							} else {
								let leaveMessage = generate({
									"cmd" : "user_del"
									,"uuid" : socket.uuid
									,"user_list" : result.clients
								})

								this.sendToHost(socket.room, leaveMessage)

								for(let index in result.clients) {
										let uuid = result.clients[index]

										let obj = {
											"cmd" : "update_user_index_result"
											,"ack" : 0
											,"uuid" : uuid
											,"roomNumber" : socket.room
											,"index" : index
										}

										let msg = generate(obj)

										this.send(uuid, msg)
									}

								if(typeof cb === 'function')
									cb()
							}
						})
					}
				})
			} else {
				if(typeof cb === 'function')
					cb()
			}
		})
	}

	/**
	 * 특정 대상에게 메시지 전송
	 *
	 * @param uuid {string} 대상의 Socket Unique ID
	 * @param msg {buffer} 보낼 메시지 
	 */
	send(uuid, msg, cb) {
		let socket = this.getSocket(uuid)
		let err = null

		if(socket !== null) {
			socket.write(msg)
		}

		if(typeof cb === 'function'){
			cb(socket)
		}
	}

	/**
	 * 특정 방의 모두에게 메시지 전송
	 *
	 * @param roomNumber {number || string} 방번호
	 * @param msg {buffer} 보낼 메시지 
	 */
	sendAll(roomNumber, msg){
		this.redis.getRoomMembers(roomNumber, (err, result) => {
			if(err) {
				throw err
			} else {
				this.send(result.host, msg)
				result.clients.forEach((item) => {
					this.send(item, msg)
				})

			}
		})
	}

	/**
	 * 특정 방의 누군가에게 메시지 전송
	 *
	 * @param roomNumber {number || string} 방번호
	 * @param targets {array} 대상의 index
	 * @param msg {buffer} 보낼 메시지 
	 */
	sendTo(targets, msg) {
		if(Array.isArray(targets)){
			targets.forEach((uuid) => {
				this.send(uuid, msg)
			})
		} else {
			this.send(targets, msg)
		}
	}

	/**
	 * 특정 방의 누군가에게 메시지 전송
	 *
	 * @param roomNumber {number || string} 방번호
	 * @param msg {buffer} 보낼 메시지 
	 */
	sendToHost(roomNumber, msg) {
		this.redis.getRoomMembers(roomNumber, (err, result) => {
			if(err) {
				throw err
			} else {
				this.send(result.host, msg)
			}
		})
	}


	/**
	 * Socket을 특정 Room에 접속시킴 
	 * 
	 * @param uuid {string} 소켓 유니크 키
	 * @param roomNumber {number || string} 방번호
	 * @param package {string} 패키지 이름 
	 * @param max_client {number} 방 최대 인원
	 * @param ishost {boolean} 
	 * @param cb {function} CallBack 함수
	 */
	joinRoom(uuid, roomNumber, package_name, ishost, cb) {
		let socket = this.getSocket(uuid)
		socket.room = roomNumber

		if(ishost){
			socket.ishost = true
		} else {
			socket.ishost = false
		}
		this.redis.joinRoom(uuid, roomNumber, package_name, ishost, cb)
	}

	/**
	 * Socket을 특정 Room에서 종료시킴
	 * 
	 * @param uuid {string} 소켓 유니크 키
	 * @param roomNumber {number || string} 방번호
	 * @param ishost {boolean} 
	 * @param cb {function} CallBack 함수
	 */
	leaveRoom(uuid, roomNumber, ishost, cb) {
		this.redis.leaveRoom(uuid, roomNumber, ishost)
		if(typeof cb === 'function')
			cb()
	}
}

module.exports = SocketManager