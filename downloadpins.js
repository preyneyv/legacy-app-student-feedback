const { Student } = require('./database')
const fs = require('fs')
const Papa = require('papaparse')

Student.find()
.select('name grade section pin -_id')
.sort({pin: 1})
.then(students => {
	let csv = Papa.unparse(students.map(s => s.toJSON()))
	fs.writeFileSync('pins.csv', csv)
	console.log('Successfully wrote ' + students.length + ' pins!')
	process.exit(0)
})
.catch(e => {
	console.error('OH NO!')
	console.error(e)
	process.exit(1)
})