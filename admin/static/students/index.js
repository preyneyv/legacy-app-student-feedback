let students
const table = $("#students-table").DataTable({
	autoWidth: false,
	// paginate: false,
	ajax: {
		url: '../api/students',
		dataSrc: (d) => students = d.students
	},
	columns: [
		{data: 'name'},
		{data: 'grade'},
		{
			data: 'section',
			defaultContent: '&mdash;'
		},
		{data: 'pin'},
		{
			data: 'used',
			render: function (data, type, row) {
				return data ? "Yes" : "No"
			}
		},
		{ // action buttons
			render: function (data, type, row) {
				if (row.used) {
					return `<i class='material-icons pin-reset'
					data-id='${row._id}'>refresh</button>`
				} else {
					return `<i class='material-icons pin-reset disabled'
					data-id='${row._id}'>refresh</button>`
				}
			}
		},
	],
	columnDefs: [
		{
			targets: -1,
			sortable: false,
			searchable: false,
			className: 'actions'
		},
	],
	drawCallback: function() {
		console.log("Table drawn!")
		$("#students-table .pin-reset").on('click', function() {
			let id = $(this).data('id')
			$(this).addClass('disabled')
			axios.post('../api/students/reset', { id })
			.then(() => {
				table.ajax.reload()
			})
		})
	}
})
