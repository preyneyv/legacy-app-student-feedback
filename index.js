const app = require('express')()

function init() {
	// Load database config
	require('./database')
	require('./routes')(app)
}

// Export these so that the app server can use them
module.exports = { app, init }