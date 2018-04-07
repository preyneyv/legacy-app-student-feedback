const {Student, Subject, Teacher, Submission} = require('./database')

exports.fetch = async (req, res) => {
	let student = await Student.findOneAndUpdate({ pin: req.post.pin, used: false }, { used: true })
	if (!student) return res.send({success: false});
	let dbSubjects = (await Subject.find({
		_id: { $in: student.subjects }
	})).map(subject => subject.toJSON())
	let subjects = []
	for (let subject of dbSubjects) {
		let teacher = await Teacher.findById(subject.teacherId)
		subjects.push({
			subject: subject.name,
			teacher: teacher.name,
			_id: subject._id
		})
	}
	res.send({success: true, subjects})
}

exports.submit = async (req, res) => {
	let { subjectId, pin, selections } = req.post
	let studentId = (await Student.findOne({ pin }))._id
	let pastSubmission = await Submission.findOne({ subjectId, studentId })
	if (pastSubmission) return res.status(400).send({success: false, message: 'already_submitted'});
	let submission = new Submission({
		subjectId,
		studentId,
		submissions: selections
	})
	await submission.save()
	res.send({success: true})
}