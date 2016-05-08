'use strict'
let uuid = require('uuid')

module.exports = function(){
	let buffer = new Buffer(32)

	uuid.v1(null, buffer)

	buffer = buffer.slice(1, 4)

	return buffer
}