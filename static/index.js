var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };
var teacherGroupTemplate = Handlebars.compile($('#teacher-group-template').html())
var questionTemplates = {
	'rating-table': Handlebars.compile($("#question-rating-table").html()),
	'multi-column-list': Handlebars.compile($("#question-multi-column-list").html()),
	'large-textbox': Handlebars.compile($("#question-large-textbox").html()),
	'yes-no': Handlebars.compile($("#question-yes-no").html()),
	'multi-from-list': Handlebars.compile($("#question-multi-from-list").html())
}
var numberRegex = /[0-9]/;

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
			var pin = ("0000" + parseInt($("#pin-input").val())).substr(-4,4); 
			submitPin(pin);
			$("#pin-input").prop('disabled', true).blur();
		}, 300);
	}
});
function submitPin(pin) {
	createViews([
	{
		teacher: "Bob Joe",
		subject: "Math",
		sections: [
		{
			title: "Rate Your Teacher",
			questions: [
			{
				type: "rating-table",
				data: {
					title: 'Learning Environment',
					rows: [
						"My teacher is friendly and approachable.",
						"The teacher ensures that all students in our class are given an opportunity to participate and share their thoughts regularly.",
						"My teacher is enthusiastic about his/her subject.",
						"My teacher uses an appropriate tone of voice.",
						"My teacher maintains a professional attitude.",
						"The teacher is a good role model.",
					]
				},
			},
			{
				type: "rating-table",
				data: {
					title: 'Teaching',
					rows: [
						"My teacher gives me a helpful introduction to the lesson for the day.",
						"My teacher is prepared for the class.",
						"My teacher is knowledgeable about the subject.",
						"My teacher shares information about current events, new discoveries or innovations related to the subject.",
						"My teacher always gives me work that is not too easy, not too challenging, but just right.",
						"My teacher makes connections to real life with the topics and subject, and therefore I understand the importance of why I am learning what is being taught.",
						"I am encouraged to present what I have learned in different ways, such as a role play, a poem, a presentation, a poster, project work, activity, etc.",
						"My teacher plans lessons that I find interesting and enjoyable.",
						"Homework is sent regulary, and I am able to complete most of them independently.",
						"The homework given helps me to learn and apply the concepts better.",
						"Students always submit their work on-time.",
						"My teacher has helped me improve and learn more in the subject this year.",
					]
				}
			}
			]
		},
		{
			title: "Rate Your Teacher",
			questions: [
			{
				type: "rating-table",
				data: {
					title: 'Assessments & Feedback',
					rows: [
						"My books are always checked by my teacher and he/she provides me with timely and helpful feedback.",
						"My teacher explains what, and how, I should prepare for any upcoming assessments.",
						"Assessments are reviewed, in a timely manner, and the teachers gives me good feedback to help me understand my strengths and how I can improve.",
						"If I haven’t understood a concept, my teacher re-teaches the concept to me.",
						"My teacher and I have set subject specific goals for myself.",
					]
				}
			},

			{
				type: "rating-table",
				data: {
					title: 'Reflecting On Myself',
					rows: [
						"I always submit my work on-time.",
						"I participate in class often.",
						"I follow the school and class rules at all times.",
						"I try my best at all times.",
					]
				}
			}
			]
		}
		]
	}
	])
}

var groups
function createViews(_groups) {
	groups = _groups
	// First generate teacher groups
	var groupElems = []
	groups.forEach(function(group, index) {
		group.index = index
		group.sections.forEach(function(section) {
			var questions = section.questions.map(function(question) {
				return "<div class='question'>" + questionTemplates[question.type](question.data) + "</div>"
			})
			section.html = questions.join('')
		})
		var groupElem = $(teacherGroupTemplate(group))
		groupElems.push(groupElem)
	})
	$("body").append(groupElems)
	// Then show the first one
	initEvents()
	setTimeout(function() {$(".teacher-group:eq(0)").addClass('show')})
}

function initEvents() {
	$(".teacher-group-hero-continue").on('click', firstSection)
	$(".next-button").on('click', nextSection)
	$(".teacher-group").bind('completed', function() {
		// Save the submissions
		var $group = $(this)
		var index = $group.data('index')
		$group.find('.rating-table-vote input:checked').each(function() {
		})
	})
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
	
	var totalInputs = $currentSection.find('.rating-table-vote input').length / 5;
	var selectedInputs = $currentSection.find('.rating-table-vote input:checked').length;
	if (totalInputs - selectedInputs !== 0) return alert('Please select a rating for every row.');
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

function groupsDone() {
	$("body").empty()
}