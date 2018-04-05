const app = require('express')()

// This app will be mounted at
// http://<app server url>/<app url>

function init() {
	// This function is called once the module loads
	// Here you can initialize everything about your app
	app.get('/', (req, res) => res.send("It works!"))
}

// Export these so that the app server can use them
module.exports = { app, init }