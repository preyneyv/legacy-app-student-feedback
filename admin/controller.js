const {Student, Subject, Teacher, Submission} = require('../database')
const Papa = require('papaparse')

const config = require('../config.json')
const questionsById = config.format.reduce((obj, section) => {
	section.questions.forEach(question => obj[question.id] = question)
	return obj
}, {})

exports.upload = async (req, res) => {
	if (!req.files) return res.status(400).send({success: false, message: 'missing_files'});
	const options = {header: true}
	let subjects, students, teachers
	try {
		subjects = Papa.parse(req.files.subjects.data.toString(), options)
		students = Papa.parse(req.files.students.data.toString(), options)
		teachers = Papa.parse(req.files.teachers.data.toString(), options)
	} catch (e) {
		return res.status(400).send({success: false, message: 'missing_files'})
	}
	if (JSON.stringify(subjects.meta.fields) != '["id","name","grade"]')
		return res.send({success: false, message: 'subjects_file_invalid'})
	if (JSON.stringify(students.meta.fields) != '["name","grade","section","subjects"]')
		return res.send({success: false, message: 'students_file_invalid'})
	if (JSON.stringify(teachers.meta.fields) != '["name","subjects"]')
		return res.send({success: false, message: 'teachers_file_invalid'})

	// Remove all existing ones
	await Student.remove({})
	await Subject.remove({})
	await Teacher.remove({})
	await Submission.remove({})

	let subjectIdMap = {}
	subjects.data.forEach(sub => {
		let subject = new Subject({
			name: sub.name,
			grade: sub.grade
		})
		subjectIdMap[sub.id] = subject
	})
	let tPromises = teachers.data.map(t => {
		let teacher = new Teacher({name: t.name})
		teacher.subjects = Papa.parse(t.subjects).data[0].map(id => {
			subjectIdMap[id].teacherId = teacher._id
			subjectIdMap[id].save()
			return subjectIdMap[id]._id
		})
		return teacher.save()
	})
	let usedPins = []
	let sPromises = students.data.map(s => {
		s.subjects = s.subjects.split(/\W?,\W?/g).map(id => subjectIdMap[id]._id)
		let pin = ("0000" + Math.floor(Math.random() * 10000)).substr(-4, 4)
		while (usedPins.indexOf(pin) != -1) {
			// get a new pin.
			pin = ("0000" + Math.floor(Math.random() * 10000)).substr(-4, 4)
		}
		usedPins.push(pin)	
		let student = new Student({
			pin,
			grade: s.grade,
			section: s.section,
			name: s.name,
			subjects: s.subjects
		})
		return student.save()
	})
	await Promise.all(tPromises.concat(sPromises))
	res.send({success: true})
}

exports.listSubjects = async (req, res) => {
	// First fetch all subjects
	// Then add teacher name to each one
	// Also, add an average rating field

	let subjects = await Subject.find()
	subjects = subjects.map(s => s.toJSON())
	.map(async subject => {
		let teacher = await Teacher.findById(subject.teacherId)
		// Added teacher name
		subject.teacher = teacher.name
		let submissions = await Submission.find({subjectId: subject._id})
		let count = 0
		let average = submissions.reduce((sum, entry) => {
			for (let id of Object.keys(entry.toJSON().submissions)) {
				// skip all rating table stuff
				if (questionsById[id].type != 'rating-table') continue;
				let response = entry.submissions[id]
				return response.reduce((sum, rating) => {
					rating = config.ratingTableMap[rating]
					count++
					return sum + rating
				}, 0)
			}
		}, 0) / count
		if (isNaN(average)) average = null;
		else average = average.toFixed(2)
		subject.average = average
		return subject
	})
	subjects = await Promise.all(subjects)
	res.send({success: true, subjects, questions: questionsById})
}

exports.listStudents = async (req, res) => {
	return res.send({
		success: true,
		students: await Student.find()
	})
}

exports.resetPin = async (req, res) => {
	await Student.update({_id: req.post.id}, {used: false})
	res.send({success: true})
}

exports.getStats = async (req, res) => {
	let { subjectId } = req.params
	console.log(subjectId)
	let submissions = await Submission.find({ subjectId })
	res.send({success: true, submissions})
}