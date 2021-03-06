let subjects, questionsById
let detailsTable
const table = $("#subjects-table").DataTable({
	autoWidth: false,
	// paginate: false,
	ajax: {
		url: 'api/subjects',
		dataSrc: (d) => {
			subjects = d.subjects
			questionsById = d.questions
			return subjects
		}
	},
	columns: [
		{data: 'name'},
		{data: 'grade'},
		{data: 'teacher'},
		{
			data: 'average',
			defaultContent: '&mdash;'
		},
		{ // action buttons
			render: function (data, type, row) {
				let disabledFlag = row.average ? "" : "disabled"
				return `
					<button ${disabledFlag} class='view-stats' data-id='${row._id}'>View</button>
				`
			}
		},
		{ // action buttons
			render: function (data, type, row) {
				let disabledFlag = row.average ? "" : "disabled"
				return `
					<button ${disabledFlag} class='view-details' data-id='${row._id}'>View</button>
				`
			}
		},
	],
	columnDefs: [
		{
			targets: [-1, -2],
			sortable: false,
			searchable: false,
			className: 'buttons-col'
		},
		{
			targets: -3,
			className: 'average-rating'
		},
	],
	drawCallback: function() {
		console.log("Table drawn!")
		$('#subjects-table .view-stats').on('click', function() {
			let subjectId = $(this).data('id')
			$('#modal-content').empty()
			$('body').addClass('modal-show')
			axios.get('api/subjects/' + subjectId)
			.then(response => response.data)
			.then(data => {
				let submissions = data.submissions.map(s => s.submissions)
				.reduce((obj, submission) => {
					for (let id of Object.keys(submission)) {
						if (!obj[id]) obj[id] = [];
						obj[id].push(submission[id])
					}
					return obj
				}, {})
				for (let id of Object.keys(questionsById)) {
					let question = questionsById[id]
					let questionDiv = $('<div>').addClass('question').css('opacity', 0)
					questionDiv.addClass(question.type)
					let q = question.data.question || question.data.title
					questionDiv.append("<h3 class='title'>" + q + "</h3>")
					questionDiv.appendTo("#modal-content")
					let contentDiv = $("<div>").addClass('content')
					questionDiv.append(contentDiv)
					questionStatsElements[question.type](contentDiv, question, submissions[id])
					
					setTimeout(() => contentDiv.hide().parent().css('opacity', 1), 500)
					questionDiv.find('.title').on('click', function() {
						$(this).next().slideToggle().toggleClass('shown')
					})

				}
			})
		})
		$('#subjects-table .view-details').on('click', function() {
			let subjectId = $(this).data('id')
			$('body').addClass('details-modal-show')
			if (detailsTable) detailsTable.destroy();
			axios.get(`api/subjects/${subjectId}/students`)
			.then(response => response.data)
			.then(data => data.submissions)
			.then(submissions => {
				detailsTable = $("#details-table").DataTable({
					autoWidth: false,
					data: submissions,
					columns: [
						{data: 'student.name'},
						{data: 'student.grade'},
						{data: 'student.section'},
						{data: 'average'},
						{
							data: 'average',
							render: function (data, type, row) {
								return `
									<button class='view-student-details' data-id='${row._id}'>View</button>
								`
							}
						},
					],
					columnDefs: {
						targets: -1,
						sortable: false,
						searchable: false,
						className: 'buttons-col'
					},
					drawCallback: function() {
						$('#details-table .view-student-details').on('click', function() {
							$('#details-modal-responses').empty()
							let id = $(this).data('id')
							let submission = detailsTable.data()
								.toArray().find(s => s._id == id)
							for (let submissionId of Object.keys(submission.submissions)) {
								let question = questionsById[submissionId]
								let div = $("<div>").addClass('question')
								if (question.data.title)
									div.append($('<h2>').text(question.data.title))
								else
									div.append($('<p>').text(question.data.question))

								div.append(detailsRendererElems[question.type](question, submission.submissions[submissionId]))

								div.appendTo('#details-modal-responses')
							}

							$('#details-modal-details-content').addClass('show').scrollTop(0)
						})
					}
				})
			})
		})
	}
})
let detailsRendererElems = {
	'rating-table': function(question, data) {
		let table = $("<table>")
		.append(
			$('<tr>')
			.append(
				$('<th>')
				.text('Question')
			)
			.append(
				$('<th>')
				.text('Response')
			)
		)
		question.data.rows.forEach((row, i) => {
			table.append(
				$('<tr>')
				.append(
					$('<td>')
					.text(row)
				)
				.append(
					$('<td>')
					.text(data[i])
				)
			)
		})

		return table
	},
	'multi-column-list': function(question, data) {
		let titlerow = $("<tr>")
		question.data.columns.forEach(col => {
			titlerow.append($("<th>").text(col))
		})
		let table = $('<table>')
		.append(titlerow)
		let row = $('<tr>')
		Object.values(data)
		.forEach(words => {
			row.append($('<td>').text(words.join('<br/>')))
		})
		table.append(row)
		return table
	},
	'large-textbox': function(question, data) {
		return $('<div>').text(data)
	},
	'yes-no': function(question, data) {
		return $('<div>').text(data ? 'Yes.' : 'No.')
	},
	'multi-from-list': function(question, data) {
		return $('<div>').text(data.join(', '))
	},
	'radio-list': function(question, data) {
		return $('<div>').text(data)
	},
}


const ratingTableColors = {
	"Needs Improvement": "#a6cee3",
	Poor: "#1f78b4",
	Good: "#b2df8a",
	Excellent: "#33a02c",
	"Not Sure": "#fb9a99"
}
let questionStatsElements = {
	'rating-table': function(elem, question, data) {
		question.data.rows.forEach((ques, i) => {
			let statement = $("<div>")
			let title = $('<h3>').html(ques)
			statement.append(title)
			statement.append("<div class='spacer'></div>")
			let canvas = $("<canvas>").attr('width', '350px').attr('height', '350px')
			statement.append($("<div class='chart-cont'>").append(canvas))
			let d = data.map(x => x[i])
			let response = _.countBy(d)
			let labels = Object.keys(response)
			let values = Object.values(response)
			let colors = labels.map(l => ratingTableColors[l])
			let chart = new Chart(canvas, {
				type: 'pie',
				data: {
					datasets: [{
						data: values,
						backgroundColor: colors
					}],
					labels
				},
				options: {
					responsive: true,
					maintainAspectRatio: false
				}
			})
			statement.appendTo(elem)
		})
	},
	'multi-column-list': function(elem, question, data) {
		let cols = data.reduce((obj, submission) => {
			for (let col of Object.keys(data[0])) {
				if (!obj[col]) obj[col] = [];
				obj[col] = obj[col].concat(submission[col])
			}
			return obj
		}, {})
		Object.keys(cols).forEach(col => {
			let cont = $("<div>")
			cont.appendTo(elem)
			cont.append("<h3>" + col + "</h3>")
			let wc = $("<div>").addClass("wordcloud")
			let counts = _.countBy(cols[col])
			let wordweights = Object.keys(counts).map(key => {
				return {
					text: key,
					weight: counts[key]
				}
			})
			wc.appendTo(cont)
			wc.jQCloud(wordweights, {autoResize: true})
		})
	},
	'large-textbox': function(elem, question, data) {
		let responses = $('<ul>').addClass('responses-list')
		data.forEach(response => {
			responses.append("<li>" + response + "</li>")
		})
		elem.append(responses)
	},
	'yes-no': function(elem, question, data) {
		let labels = [question.data['no-label'], question.data['yes-label']]
		let canvas = $("<canvas>").attr('width', '350px').attr('height', '350px')
		elem.append($("<div>").append(canvas))
		let response = _.countBy(data)
		let values = [response.false || 0, response.true || 0]
		let colors = ["#FF5E5A", "#09B241"]
		let chart = new Chart(canvas, {
			type: 'pie',
			data: {
				datasets: [{
					data: values,
					backgroundColor: colors
				}],
				labels
			},
			options: {
				responsive: true,
				maintainAspectRatio: false
			}
		})
	},
	'multi-from-list': function(elem, question, data) {
		let numWords = data[0].length
		let flattenedWords = data.reduce((arr, words) => {
			let mappedWords = words.map((word, i) => {
				return { text:word, weight: (numWords/2) + (numWords-i) }
			})
			return arr.concat(mappedWords)
		}, [])
		let counts = _(flattenedWords)
		.groupBy('text')
		.map((objs, key) => ({
			text: key,
			weight: _.sumBy(objs, 'weight')
		}))
		.value()
		let wc = $("<div>").addClass("wordcloud")
		wc.appendTo(elem)
		wc.jQCloud(counts, {autoResize: true})
	},
	'radio-list': function(elem, question, data) {
		let list = $("<ul>").addClass('radio-list-ul')
		data = _.countBy(data)
		let sum = _.sum(Object.values(data))
		
		question.data.options.forEach(function(option) {
			let li = $("<li>")
			let count = data[option.value] || 0
			let percent = count / sum
			console.log(percent)
			let printPercent = (percent*100).toFixed(1)
			li.append($('<span>').html(option.label + ` &mdash; ${printPercent}% (${count}/${sum})`))
			li.append($("<div>").css('width', percent*100 + "%"))
			li.attr('data-percent', percent)
			list.append(li)
		})
		elem.append(list)
	},
}

$("#modal-close").on('click', function() {
	$('#modal-content').empty()
	$('body').removeClass('modal-show')
})

$("#details-modal-close").on('click', function() {
	if ($("#details-modal-details-content").is('.show'))
		$("#details-modal-details-content").removeClass('show')
	else 
		$("body").removeClass('details-modal-show')
})