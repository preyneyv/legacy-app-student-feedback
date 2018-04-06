const config = require('./config.json')
const express = require('express')
const controller = require('./controller')

module.exports = app => {
	app.use('/', express.static(__dirname + '/static'))
	
	app.get('/api/questions', (req, res) => res.send(config.format))
	app.post('/api/fetch', controller.fetch)
	app.post('/api/submit', controller.submit)
}