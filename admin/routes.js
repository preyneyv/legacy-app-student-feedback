const express = require('express')

const config = require('../config.json')
const controller = require('./controller')

module.exports = app => {
	app.use(express.static(__dirname + '/static'))
	
	app.get('/api/subjects/', controller.listSubjects)
	app.get('/api/students/', controller.listStudents)
	app.get('/api/subjects/:subjectId/', controller.getStats)

	app.post('/api/students/reset', controller.resetPin)
	app.post('/api/upload/', controller.upload)
}