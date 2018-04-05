const express = require('express')
const controller = require('./controller')

module.exports = app => {
	app.use('/', express.static(__dirname + '/static'))
}