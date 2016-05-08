'use strict'
/**
 * Redis 관리자
 * Redis 관련 메소드를 제공
 */
let redis = require('redis')
	,async = require('async')

let instance = null

let room_key = "room"

class RedisManager {
	constructor(pid) {
		if (!instance) {
			instance = this
		}

		this._key = [pid, "socket"].join(":")
		this.client = redis.createClient()

		return instance
	}

	/**
	 * Redis에 소켓 uuid 추가
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 */
	addSocketId(uuid) {
		this.client.sadd(this._key, uuid)
	}

	/**
	 * Redis에 소켓 uuid 삭제
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 */
	removeSocketId(uuid){
		this.client.srem(this._key, uuid)
		this.client.srem("uuid", uuid)
	}

	/**
	 * 특정 uuid가 현재 프로세스에서 관리중인지 확인
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 * @param cb {function} CallBack 함수
	 */
	isManagedSocket(uuid, cb){
		this.client.sismember(this._key, uuid, (err, result) => {
			cb(err, result===1?true:false)
		})
	}

	/**
	 * uuid를 통해 방에 접속, 정보를 redis에 저장함
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 * @param roomNumber {number||string} 방번호
	 * @param ishost {boolean} host인지 여부
	 */
	joinRoom(uuid, roomNumber, package_name, ishost, cb) {
		async.waterfall([
			(callback) => { // 방 존재 확인
				this.client.sismember(room_key, roomNumber, (err, result) => {
					if(err){
						callback(err)
					} else {
						if(result){ // 존재하는 경우 
							callback(null)
						} else {
							let error = {
								cmd : "join_result"
								,ack : 20001 // TODO : 추후 에러 코드
								,msg : "Invalid RoomNumber"
							}
							callback(error)
						}
					}
				})
			}
			, (callback) => { // 방 정보 가져오기
				let key = [room_key, roomNumber].join(":")

				this.client.hgetall(key, (err, info) => {
					if(err) {
						callback(err)
					} else {
						async.parallel({
							"package" : (p_callback) => {
								if(info.package === package_name) {
									p_callback(null, true)
								} else {
									let error = {
										cmd : "join_result"
										,ack : 20002 // TODO : 추후 에러 코드
										,msg : "Invalid Game pad"
									}

									p_callback(error)
								}
							}
							,"status" : (p_callback) => {
								if(info.status === "open") {
									p_callback(null, true)
								} else {
									let error = {
										cmd : "join_result"
										,msg : "This room can NOT join"
									}

									if(info.status === "full"){
										error["ack"] = 20003
									} else {
										error["ack"] = 20004
									}

									p_callback(error)
								}
							}
						}, (err) => {
							if(err){
								callback(err)
							} else {
								callback(null, info)
							}
						})
					}
				})
			}
			, (info, callback) => { // 방 인원 확인 
				let key = [room_key, roomNumber].join(":")

				let cb_func = (err, result) => { // 방 인원 가져옴
					if(err) {
						callback(err)
					} else {
						if(ishost) { // 호스트의 경우 
							if(result > 0) {
								let error = {
									cmd : "join_result"
									,ack : 29999 // TODO : 추후 에러코드
									,msg : "Host was already joined"
								}

								callback(error)
							} else {
								callback(null)
							}
						} else { // 호스트가 아닌 경우 
							if(result >= info.max) { // 이미 방 인원이 가득 차 있는경우
								this.client.hset(key, "status", "full")

								let error = {
									cmd : "join_result"
									,ack : 20003 // TODO : 추후 에러 코드
									,msg : "This room is full"
								}

								callback(error)
							} else {
								callback(null)
							}
						}
					}
				}

				if(ishost) {
					let room_mem_key = [room_key, roomNumber, "host"].join(":")
					this.client.scard(room_mem_key, cb_func)
				} else {
					let room_mem_key = [room_key, roomNumber, "clients"].join(":")		
					this.client.llen(room_mem_key, cb_func)
				}

			}
		], (err) => {
			if(err) {
				cb(err)
			} else {
				if(ishost) {
					let key = [room_key, roomNumber, "host"].join(":")
					this.client.sadd(key, uuid)
				} else {
					let key = [room_key, roomNumber, "clients"].join(":")
					this.client.rpush(key, uuid)
				}

				cb(null)
			}
		})
	}

	/**
	 * 방에대한 정보에서 특정 uuid 삭제
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 * @param roomNumber {number||string} 방번호
	 * @param ishost {boolean} host인지 여부
	 */
	leaveRoom(uuid, roomNumber, ishost){
		if(ishost) {
			let key = [room_key, roomNumber, "host"].join(":")
			this.client.srem(key, uuid)
			this.clearRoom(roomNumber)
		} else {
			let key = [room_key, roomNumber, "clients"].join(":")
			this.client.lrem(key, 1, uuid)
		}
	}

	/**
	 * 방에대한 정보에서 모든 유저 가져오기
	 *
	 * @param roomNumber {number||string} 방번호
	 * @param cb {function} CallBack 함수
	 */
	getRoomMembers(roomNumber, cb) {
		async.parallel({
			"host" : (callback) => {
				let key = [room_key, roomNumber, "host"].join(":")

				this.client.smembers(key, (err, result) => {
					if(err) {
						callback(err)
					} else {
						callback(null, result[0])
					}
				})
			}
			,"members" : (callback) => {
				let key = [room_key, roomNumber, "clients"].join(":")

				this.client.lrange(key, 0, 100, (err, result) => {
					if(err) {
						callback(err)
					} else {
						callback(null, result)
					}
				})
			}
		}, (err, result) => {
			if(err) {
				cb(err)
			} else {
				let host = result.host
				let clients = []
				for(let i = 0, len = result.members.length; i < len; i++) {
					if(result.members[i] !== host) {
						clients.push(result.members[i])
					}
				}

				cb(null, {
					"host" : host
					,"clients" : clients
				})
			}
		})
	}

	/**
	 * 방에대한 정보에서 호스트
	 *
	 * @param roomNumber {number||string} 방번호
	 * @param cb {function} CallBack 함수
	 */
	getHost(roomNumber, cb){
		let key = [room_key, roomNumber, "host"].join(":")

		this.client.smembers(key, (err, result) => {
			if(err) {
				cb(err)
			} else {
				cb(null, result[0])
			}
		})
	}

	/**
	 * 특정 uuid가 host유저인지 확인
	 *
	 * @param uuid {string} 소켓 유니크 아이디
	 * @param roomNumber {number||string} 방번호
	 * @param cb {function} CallBack 함수
	 */
	isHost(uuid, roomNumber, cb) {
		let key = [room_key, roomNumber, "host"].join(":")
		this.client.sismember(key, uuid, (err, result) => {
			cb(err, result===1?true:false)
		})
	}

	/**
	 * Room의 Max User 변경
	 *
	 * @param roomNumber {number||string} 방번호
	 * @param maxUser {number} 방의 최대 인원
	 * @param cb {function} CallBack 함수
	 */
	setMaxUser(roomNumber, maxUser, cb) {
		let key = [room_key, roomNumber].join(":")

		this.client.hset(key, "max", maxUser)
		async.waterfall([
			(callback) => {
				this.client.hset(key, "max", maxUser)
				callback(null)
			}
			,(callback) => {
				this.client.hgetall (key, (err, result) => {
					if(err) {
						callback(err)
					} else {
						callback(null, result)
					}
				})
			}
		], (err, result) => {
			if(err) {
				cb(err)
			} else {
				this.getRoomMembers(roomNumber, (err, member) => {
					if(err) {
						throw err
					} else {
						if(result.max > member.clients.length){
							this.client.hset(key, "status", "open")
						}
						cb(null)
					}
				})
			}
		})
				
	}

	/**
	 * Room의 status 변경
	 *
	 * @param roomNumber {number||string} 방번호
	 * @param status {string} 방의 상태
	 * @param cb {function} CallBack 함수
	 */
	setRoomStatus(roomNumber, status, cb){
		let key = [room_key, roomNumber].join(":")

		this.client.hset(key, "status", status)	

		if(typeof cb === 'function')
			cb()
	}

	/**
	 * 방에대한 정보를 Clear 함
	 *
	 * @param roomNumber {number||string} 방번호
	 * @param cb {function} CallBack 함수
	 */
	clearRoom(roomNumber, cb) {
		async.parallel({
			"removeHost" : (callback) => {
				let key = [room_key, roomNumber, "host"].join(":")
				this.client.smembers(key + ":host", (err, host) => {
					if(err) {
						callback(err)
					} else {
						for(let i = 0, len = host.length; i < len; i++) {
							this.removeSocketId(host[i])
							this.client.srem(key + ":host", host[i])
						}
						callback(null)
					}
				})
			}
			,"removeUser" : (callback) => {
				let key = [room_key, roomNumber, "clients"].join(":")
				this.client.lrange(key, 0, 100, (err, result) => {
					if(err) {
						callback(err)
					} else {
						for(let i = 0, len = result.length; i < len; i++){
							this.removeSocketId(result[i])
							this.client.lrem(key, 1, result[i])
						}
						callback(null)
					}
				})
			}
			,"removeRoom" : (callback) => {
				let key = [room_key, roomNumber].join(":")

				this.client.srem("room", roomNumber)
				this.client.hdel(key, "package")
				this.client.hdel(key, "max")
				this.client.hdel(key, "status")
				callback(null)
			}
		}, (err) => {
			if(typeof cb === "function")
				cb(err)
		})
	}
}

module.exports = RedisManager