let subjects
const table = $("#subjects-table").DataTable({
	autoWidth: false,
	// paginate: false,
	ajax: {
		url: 'api/subjects',
		dataSrc: (d) => {
			subjects = d.subjects,
			console.log(subjects)
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
				return `
					<button class='view-stats'>View</button>
				`
			}
		},
	],
	columnDefs: [
		{
			targets: -1,
			sortable: false,
			searchable: false,
			className: 'stats-col'
		},
		{
			targets: -2,
			className: 'average-rating'
		},
	],
	drawCallback: function() {
		console.log("Table drawn!")
		
	}
})
