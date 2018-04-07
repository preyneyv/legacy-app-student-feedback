$("#import-files").on('submit', function(e) {
	e.preventDefault()
	e.stopPropagation()
	if (!confirm("Are you sure you want to import these files?")) return;

	let fd = new FormData(this)
	axios.post('../api/upload', fd)
	.then(response => response.data)
	.then(data => {
		alert('Import succeeded!')
	})
	.catch(e => {
		alert("An unexpected error occured.")
		throw e
	})
})