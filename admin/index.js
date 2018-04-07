const app = require('express')()


function init() {
	const fileupload = require('express-fileupload')
	app.use(fileupload())
	require('./routes')(app)
}

module.exports = { app, init }