let config = require('./config.json')

let mongoose = require('mongoose')
let { Schema } = mongoose

mongoose.connect(config.dbUri)


const studentSchema = new Schema({
	pin: String,
	grade: Number,
	section: String,
	name: String,
	used: {
		type: Boolean,
		default: false
	},
	subjects: [ Schema.Types.ObjectId ]
})

const subjectSchema = new Schema({
	name: String,
	grade: Number,
	teacherId: Schema.Types.ObjectId
})

const teacherSchema = new Schema({
	name: String,
	subjects: [ Schema.Types.ObjectId ]
})

const submissionSchema = new Schema({
	subjectId: Schema.Types.ObjectId,
	studentId: Schema.Types.ObjectId,
	submissions: Schema.Types.Mixed
})

module.exports = {
	Student: mongoose.model('Student', studentSchema),
	Subject: mongoose.model('Subject', subjectSchema),
	Teacher: mongoose.model('Teacher', teacherSchema),

	Submission: mongoose.model('Submission', submissionSchema),
}