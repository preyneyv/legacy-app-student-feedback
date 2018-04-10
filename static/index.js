Handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
});

var teacherGroupTemplate = Handlebars.compile($('#teacher-group-template').html())
var questionTemplates = {
	'rating-table': Handlebars.compile($("#question-rating-table").html()),
	'multi-column-list': Handlebars.compile($("#question-multi-column-list").html()),
	'large-textbox': Handlebars.compile($("#question-large-textbox").html()),
	'yes-no': Handlebars.compile($("#question-yes-no").html()),
	'multi-from-list': Handlebars.compile($("#question-multi-from-list").html()),
	'radio-list': Handlebars.compile($("#question-radio-list").html())
}
var questionValidators = {
	'rating-table': function($question) {
		var totalInputs = $question.find('.rating-table-vote input').length / 5;
		var selectedInputs = $question.find('.rating-table-vote input:checked').length;
		if (totalInputs - selectedInputs !== 0) {
			alert('Please select a rating for every row.');
			return true;
		}
		return false
	},
	'multi-column-list': function($question) {
		let matching = $question.find('ul').map(function() {
			return $(this).find('li').length > 0
		}).get()
		if (matching.every(e => e)) return false;
		else alert('Enter at least one value for each column.'); return true;

	},
	'large-textbox': function($question) {
		var textbox = $question.find('textarea')
		if (textbox.val().length > 0) return false;
		else alert('Please type something in the text box.'); return true;
	},
	'yes-no': function($question) {
		if ($question.find('input:checked').length == 1) return false;
		else alert('Please select yes or no.'); return true;
	},
	'multi-from-list':  function($question) {
		let matching = $question.find('select').map(function() {
			return !!$(this).val()
		}).get()
		if (matching.every(e => e)) return false;
		else alert('Select an item for each dropdown.'); return true;
	},
	'radio-list': function($question) {
		if ($question.find('input:checked').length == 1) return false;
		else alert('Select an option in the poll.'); return true;		
	}
}
var questionProcessors = {
	'rating-table': function(question) {
		var $table = question.find('.rating-table')
		let retval = []
		$table.find('input:checked').each(function() {
			let row = $(this).parents('tr').index()
			let val = $(this).val()
			retval[row] = val
		})
		return retval
	},
	'multi-column-list': function(question) {
		var $table = question.find('.multi-column-list')
		var headings = $table.find('th').map(function() {return $(this).text()}).get()
		var retval = {}
		$table.find('ul').each(function() {
			let column = $(this).parents('td').index() 
			let heading = headings[column]
			let val = $(this).find('li').map(function() {return $(this).text()}).get()
			retval[heading] = val
		})
		return retval
	},
	'large-textbox': function(question) {
		var $textbox = question.find('.large-textbox')
		return $textbox.val()
	},
	'yes-no': function(question) {
		var value = question.find('input:checked').val()
		return value == '1'
	},
	'multi-from-list': function(question) {
		var inputs = question.find('.multi-from-list-select')
		var values = inputs.map(function() {return $(this).val()}).get()
		return values
	},
	'radio-list': function(question) {
		var value = question.find('input:checked').val()
		return value
	}
}
var numberRegex = /[0-9]/;
var pin;
$("#pin-input").on('keypress', function (e) {
	var code = e.which || e.code
	e.key = e.key || String.fromCharCode(code)	

	if (!numberRegex.test(e.key) || $("#pin-input").val().length === 4) {
		e.preventDefault();
		e.stopPropagation();
		return;
	}
	if ($("#pin-input").val().length === 3) {
		setTimeout(function () {
			pin = ("0000" + parseInt($("#pin-input").val())).substr(-4,4); 
			submitPin(pin);
			$("#pin-input").prop('disabled', true).blur();
		}, 300);
	}
});
function submitPin(pin) {
	axios.post('api/fetch', { pin })
	.then(response => response.data)
	.then(data => {
		if (data.success) {
			let { subjects } = data
			return axios.get('api/questions')
			.then(response => response.data)
			.then(questions => createViews(questions, subjects))
		} else {
			alert('Invalid pin!')
			$("#pin-input").prop('disabled', false).focus().val('')
		}
	})
}

var groups
function createViews(questions, subjects) {
	let uniques = []
	questions.forEach(section => {
		section.questions.forEach(question => {
			let unique = '_' + Math.random().toString(36).substr(2, 9);
			while(uniques.indexOf(unique) != -1) {
				unique = '_' + Math.random().toString(36).substr(2, 9);
			}
			question.data.unique = unique
		})
	})
	groups = subjects.map((subject, i) => {
		let sections = questions.map(section => {
			let ques = section.questions.map(q => {
				let clone = JSON.parse(JSON.stringify(q))
				clone.data.unique += i
				return clone
			})
			return {...section, questions: ques}
		})
		return {
			...subject,
			sections
		}
	})
	// First generate teacher groups
	var groupElems = []
	groups.forEach(function(group, index) {
		group.index = index
		group.sections.forEach(function(section) {
			var questions = section.questions.map(function(question) {
				let questionDiv = $("<div class='question'>" +
				questionTemplates[question.type](question.data) + "</div>")
				questionDiv.attr('data-type', question.type)
				questionDiv.attr('data-id', question.id)
				questionDiv.attr('data-required', question.required)
				return questionDiv.prop('outerHTML')
			})
			section.html = questions.join('')
		})
		var groupElem = $(teacherGroupTemplate(group))
		groupElems.push(groupElem)
	})
	$("body").append(groupElems)
	initEvents()
	// Then show the first one
	setTimeout(function() {$(".teacher-group:eq(0)").addClass('show')}, 20)
}

function initEvents() {
	$(".teacher-group-hero-continue").on('click', firstSection)
	$(".next-button").on('click', nextSection)
	$(".teacher-group").bind('completed', submitGroup)
	$(".rating-table-vote label").on('click', function() {
		$(this).prev().click()
	})
	$(".multi-column-list-input").on('keyup', function(e) {
		let code = e.which || e.code
		if (code == 13) {
			if ($(this).val() == "") return;
			let colIndex = $(this).parent().index()
			let list = $(this).parents('tbody').find(`td:eq(${colIndex}) ul`)
			let $li = $('<li>').html($(this).val())
			$li.on('click', function() {
				$(this).slideUp(function() {
					$(this).remove()
				})
			})
			list.append($li)
			$(this).val("")
		}
	})
	$(".multi-from-list-select").on('change', function(e) {
		if (!$(this).data('no-repeats')) return;
		let previous = $(this).data('previous')
		let current = $(this).val()
		let $others = $(this).parent().siblings().find('.multi-from-list-select')
		$others.each(function() {
			$(this).find('option').each(function() {
				if ($(this).text() == previous) 
					$(this).prop('disabled', false)
				if ($(this).text() == current)
					$(this).prop('disabled', true)
			})
		})
		$(this).data('previous', current)
	});
}

function checkIfCanProceed() {
	var $currentGroup = $(this).parents('.teacher-group')
	var $currentSection = $currentGroup.find('.section.show')
	
	let canProceed = !$currentSection.find('.question').toArray().some(function(elem) {
		let $elem = $(elem)
		if (!$elem.data('required')) return false;
		let type = $elem.data('type')
		return questionValidators[type]($elem)
	})

	return canProceed;
}

function changeTitle(group, newTitle) {
	// Animate the title change
	var title = group.find('.group-title')
	if (title.find('.current-title').text() == newTitle) return;
	title.find('.next-title').text(newTitle)
	title.addClass('next')
	setTimeout(function() {
		title.removeClass('next').find('.current-title').text(newTitle)
	}, 500)
}

function firstSection() {
	var $currentGroup = $(this).parents('.teacher-group')
	var $hero = $(this).parents('.teacher-group-hero')
	var $firstSection = $currentGroup.find('.section').eq(0)
	$hero.addClass('hide')
	$currentGroup.find('.current-title').text($firstSection.data('title'))
	$firstSection.addClass('show')
}

function nextSection() {
	var $currentGroup = $(this).parents('.teacher-group')
	var $currentSection = $currentGroup.find('.section.show')
	
	
	if (!checkIfCanProceed.call(this)) return;
	if (!confirm('Are you sure you want to proceed?')) return;

	$currentSection.triggerHandler('completed')

	var $nextSection = $currentSection.next()
	if (!$nextSection.length) return nextGroup();

	changeTitle($currentGroup, $nextSection.data('title'))
	$currentSection.toggleClass('show done')
	$nextSection.addClass('show')
}

function nextGroup() {
	var $currentGroup = $('.teacher-group.show')
	$currentGroup.triggerHandler('completed')
	var $nextGroup = $currentGroup.next()
	if (!$nextGroup.length) return groupsDone();
	setTimeout(function() {$currentGroup.removeClass('show')}, 500)

	$nextGroup.addClass('show')
}

function submitGroup() {
	// Submit the user's selections
	var $group = $(this)
	var index = $group.data('index')
	var selections = {}
	$group.find('.question').each(function() {
		console.log('Looping')
		let type = $(this).data('type')
		console.log(type)
		let value = questionProcessors[type]($(this))
		console.log(value)
		let id = $(this).data('id')
		selections[id] = value
	})
	axios.post('api/submit', {
		subjectId: $group.data('subject-id'),
		selections,
		pin
	})
	.then(() => console.log('Saved submission.'))
}

function groupsDone() {
	$("body").empty()
	alert('Thank you for participating! Your submissions have been saved.')
}