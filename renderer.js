// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//--------------------------//
// Required Packages		//
//--------------------------//
import 'remixicon/fonts/remixicon.css'

//--------------------------//
// Modules					//
//--------------------------//

//--------------------------//
// Document Elements		//
//--------------------------//

const elemArchivedList = document.getElementById('archived-list')
const elemCountdown = document.getElementById('timer')
const elemProjectList = document.getElementById('project-list')
const elemSettings = document.getElementById('settings')
const templateModalArchiveDelete = document.getElementById('modal-archive-delete')
const templateModalCreateEdit = document.getElementById('modal-create-edit')
const templateModalSettings = document.getElementById('modal-settings')
const templateModal = document.getElementById('modal')
const templateListItem = document.getElementById('list-item')
const templateArchivedListItem = document.getElementById('archived-list-item')

//--------------------------//
//	Variables				//
//--------------------------//

let time = 0
let interval = null
let currentID = 2
let modalState = null
let currentTask = null

//--------------------------//
//	Event Listeners			//
//--------------------------//

document.addEventListener('click', function (event) {

	console.log(event.target)

	// Play Event
	if (event.target.matches('#play')) {

		// Check to see if another interval is running
		if (currentTask != null) {

			// If one is, kill it
			intervalStop(currentTask)
		}

		// Set the current task
		currentTask = event.target.parentElement.parentElement

		// Get the current task's current time
		let timeArray = currentTask
			.querySelector('.total-time')
			.innerText.split(':')

		time = timeArray[0] * 60 * 60 + timeArray[1] * 60 + timeArray[2] * 1

		// Run function every second (1000 milliseconds)
		interval = setInterval(updateCountdown, 1000)

		// Highlight active timer
		const listItems = document.querySelectorAll('.list-item')
		const listItemsArray = [...listItems]

		// Remove the highlight class from any other item
		listItemsArray.forEach((e) => {

			// Remove highlight class
			e.classList.remove('highlight', 'active')

			// Change class and id to play
			event.target.classList = 'ri-play ri-xl'
			event.target.id = 'play'
		})

		// Change class and id to stop
		event.target.classList = 'ri-stop-fill ri-xl'
		event.target.id = 'stop'

		// Add the highlight class to this item
		currentTask.classList.add('highlight', 'active')

		return
	}

	// Stop Event
	if (event.target.matches('#stop')) {

		// Stop the interval
		intervalStop(currentTask)

		return
	}

	// Edit Event
	if (event.target.matches('#edit')) {
		// Set the modal state
		modalState = 'edit'

		// Get task ID
		let taskId = event.target.parentElement.parentElement.id

		// Launch modal
		modalLaunch(taskId)

		return
	}

	// Save Event
	if (event.target.matches('#save')) {

		// Change class and id of edit/save
		event.target.classList = 'ri-edit-box-line'
		event.target.title = 'Edit Task'
		event.target.id = 'edit'

		return
	}

	// Duplicate Event
	if (event.target.matches('#duplicate')) {

		// Duplicate current node
		duplicateNode(event.target.parentElement.parentElement)

		return
	}

	// Archive Event
	if (event.target.matches('#archive')) {

		// Set the modal state
		modalState = 'archive'

		/// Launch modal
		modalLaunch(event.target.parentElement.parentElement.id)

		return
	}

	// Delete Event
	if (event.target.matches('#delete')) {

		// Set the modal state
		modalState = 'delete'

		// Launch modal
		modalLaunch(event.target.parentElement.parentElement.id)

		return
	}

	// Add Event
	if (event.target.matches('#add')) {

		// Set modal state
		modalState = 'create'

		// Launch modal
		modalLaunch(currentID)

		return
	}

	// Modal - Save Event
	if (event.target.matches('#saveModal')) {
		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		// Save the current values to task
		saveTask(event.target, modalContainer.getAttribute('data-task-id'))

		// Close the modal
		modalClose(modalContainer)

		return
	}

	// Modal - Cancel Event
	if (event.target.matches('#cancelModal')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		modalClose(modalContainer)

		return
	}

	// Modal - Yes Event
	if (event.target.matches('#yesModal')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		if (modalState === 'archive') {
			// Archive current node
			archiveNode(modalContainer.dataset.taskId)
		}

		if (modalState === 'delete') {
			// Delete current node
			deleteNode(event.target.parentElement.parentElement)
		}

		// Close the modal
		modalClose(modalContainer)

		return
	}

	// Modal - No Event
	if (event.target.matches('#noModal')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		modalClose(modalContainer)

		return
	}

	// Modal - Outside Click Event
	if (event.target.matches('.modal-container')) {
		// If you click outside the modal box, it closes the modal
		modalClose(event.target)

		return
	}

	// Settings - Open Event
	if (event.target.matches('#settings-open')) {

		// Set the modal state
		modalState = 'settings'

		/// Launch modal
		modalLaunch('settings')

		return

		return
	}

	// Settings - Close Event
	if (event.target.matches('#settings-close')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		// Close the modal
		modalClose(modalContainer)

		return

	}
},
	false
)

//--------------------------//
//	Functions				//
//--------------------------//

function archiveNode(target) {

	let targetTask = document.getElementById(target)
	console.log(targetTask)

	// Add task to Archived Projects

	// Clone task template
	let taskTemplateClone = templateArchivedListItem.content.cloneNode(true)
	let taskTemplate = taskTemplateClone.querySelector('.list-item')

	// Set task values
	taskTemplate.id = targetTask.id
	taskTemplate.querySelector('.task').innerText = targetTask.querySelector('.task').innerText
	taskTemplate.querySelector('.project').innerText = targetTask.querySelector('.project').innerText
	taskTemplate.querySelector('.client').innerText = targetTask.querySelector('.client').innerText
	taskTemplate.querySelector(
		'.start-date'
	).innerText = targetTask.querySelector('.start-date').innerText
	taskTemplate.dataset.archived = 'true'

	// Remove Task from Current Projects and Add it to Archived Projects

	// Add hide class from cloned node
	taskTemplate.classList.add('hide')

	// Append clone to project list
	elemArchivedList.appendChild(taskTemplate)

	// Add highlight/delete classes to old node
	targetTask.classList.add('highlight', 'delete')

	// Set time out for 0.125 seconds
	setTimeout(() => {

		// Remove hide class from cloned node
		taskTemplate.classList.remove('hide')

		// Add hide class to old node
		targetTask.classList.add('hide')

		// After 0.25 seconds remove the old node
		setTimeout(() => {
			targetTask.remove()
		}, 260)
	}, 250)
}

function deleteNode(target) {
	// Change background color and hide out
	target.classList.add('highlight', 'delete')
	target.classList.add('hide')

	// After 0.6 seconds remove the node
	setTimeout(() => {
		target.remove()
	}, 600)
}

function duplicateNode(target) {
	// Change background color
	target.classList.add('highlight', 'duplicate')

	// After 0.25 seconds, hide out highlight color
	setTimeout(() => {
		// Change background color
		target.classList.remove('highlight', 'duplicate')

		// Clone target node
		let node = target.cloneNode(true)

		// Change clone node's ID
		node.id = currentID

		// Add class to clone node
		node.classList.add('hide')

		// Append clone to project list
		elemProjectList.appendChild(node)

		// Increase current id
		currentID++

		// Set time out for 0.1 seconds
		setTimeout(() => {
			// Remove class to clone node
			node.classList.remove('hide')
		}, 100)
	}, 250)

}

function intervalStop(target) {
	// Reset current task
	currentTask = null

	// Change class and id
	target.querySelector('.time-controls > i').classList = 'ri-play-fill ri-xl'
	target.querySelector('.time-controls > i').id = 'play'

	// Stop the interval loop
	clearInterval(interval)

	// Remove the highlight class to this item
	target.classList.remove('highlight', 'active')
}

function modalClose(modal) {
	// Reset modal state
	modalState = null

	// Add hide class
	modal.classList.add('hide')

	// Take 0.7 seconds and remove modal
	setTimeout(() => {
		// Remove modal
		modal.remove()
	}, 700)
}

function modalLaunch(id) {
	// Check to see what time of modal it is
	if (modalState === 'create' || modalState === 'edit') {
		// Get template and clone it
		const cloneTemplate = templateModalCreateEdit.content.cloneNode(true)

		// Set clone as variable
		const clone = cloneTemplate.querySelector('.modal-container')

		// Set clone's id
		clone.setAttribute('data-task-id', id)

		// If modal is an edit modal
		if (modalState === 'edit') {
			// Get the task we're editing
			const task = document.getElementById(id)

			// Change the form title
			clone.querySelector('h2').innerHTML = 'Edit Task'

			// Set the form values to the current values
			clone.querySelector('[name=task]').value =
				task.querySelector('.task').innerText
			clone.querySelector('[name=project]').value =
				task.querySelector('.project').innerText
			clone.querySelector('[name=client]').value =
				task.querySelector('.client').innerText
		}

		// Append the clone to the body
		document.body.prepend(cloneTemplate)

		// Take 0.1 seconds and remove hide
		setTimeout(() => {
			// Remove class to clone node
			clone.classList.remove('hide')
		}, 100)

	} else if (modalState === 'archive' || modalState === 'delete') {

		// Get template and clone it
		const cloneTemplate = templateModalArchiveDelete.content.cloneNode(true)

		// Set clone as variable
		const clone = cloneTemplate.querySelector('.modal-container')

		// Set clone's id
		clone.setAttribute('data-task-id', id)

		// If modal is an edit modal
		if (modalState === 'delete') {
			// Get the task we're editing
			const task = document.getElementById(id)

			// Change the form title
			clone.querySelector('h2').innerHTML = 'Delete Task'
			clone.querySelector('p').innerHTML = 'Do you want to delete this task? This cannot be undone.'
		}

		// Append the clone to the body
		document.body.prepend(cloneTemplate)

		// Take 0.1 seconds and remove hide
		setTimeout(() => {
			// Remove class to clone node
			clone.classList.remove('hide')
		}, 100)
	} else if (modalState === 'settings') {

		// Get template and clone it
		const cloneTemplate = templateModalSettings.content.cloneNode(true)

		// Set clone as variable
		const clone = cloneTemplate.querySelector('.modal-container')

		// Append the clone to the body
		document.body.prepend(cloneTemplate)

		// Take 0.1 seconds and remove hide
		setTimeout(() => {
			// Remove class to clone node
			clone.classList.remove('hide')
		}, 100)
	}
}

function saveTask(target, id) {
	const formTask =
		target.parentElement.parentElement.querySelector('[name=task]').value
	const formProject =
		target.parentElement.parentElement.querySelector('[name=project]').value
	const formClient =
		target.parentElement.parentElement.querySelector('[name=client]').value

	// Run the correct function
	if (modalState === 'create') {
		taskCreate(id, formTask, formProject, formClient)
	} else if (modalState === 'edit') {
		taskEdit(id, formTask, formProject, formClient)
	} else {
		console.log(`HOW THE ACTUAL FUCK DID YOU NOT SET THE MODAL STATE?`)
	}
}

function taskCreate(id, task, project, client) {
	// Clone task template
	let taskTemplateClone = templateListItem.content.cloneNode(true)
	let taskTemplate = taskTemplateClone.querySelector('.list-item')

	// Get current date for start date
	let newDate = new Date()
	let dateDay = newDate.getDate()
	let dateMonth = newDate.getMonth() + 1
	const dateYear = newDate.getFullYear()
	if (dateDay < 10) {
		dateDay = `0${dateDay}`
	}

	if (dateMonth < 10) {
		dateMonth = `0${dateMonth}`
	}

	// Set task values
	taskTemplate.id = id
	taskTemplate.querySelector('.task').innerHTML = task
	taskTemplate.querySelector('.project').innerHTML = project
	taskTemplate.querySelector('.client').innerHTML = client
	taskTemplate.querySelector(
		'.start-date'
	).innerHTML = `${dateMonth}-${dateDay}-${dateYear}`

	// Add class to clone node
	taskTemplate.classList.add('hide')

	// Append clone to project list
	elemProjectList.appendChild(taskTemplate)

	// Set time out for 0.1 seconds
	setTimeout(() => {
		// Remove class to clone node
		taskTemplate.classList.remove('hide')
	}, 100)

	// Increase current id
	currentID++
}

function taskEdit(id, task, project, client) {
	// Get the task we're editing
	const currentTask = document.getElementById(id)

	console.log(currentTask)

	// Add class to clone node
	currentTask.classList.add('highlight', 'edit', 'fast')

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Set the form values to the current values
		currentTask.querySelector('.task').innerText = task
		currentTask.querySelector('.project').innerText = project
		currentTask.querySelector('.client').innerText = client

		// Set time out for 0.1 seconds
		setTimeout(() => {
			// Remove class to clone node
			currentTask.classList.remove('highlight', 'edit', 'fast')
		}, 100)
	}, 125)
}

function updateCountdown() {
	console.log(`time: ${time}`)

	// Set minutes/seconds to current time
	let hours = Math.floor(time / 3600)
	let minutes = Math.floor((time - hours * 3600) / 60)
	let seconds = time % 60

	// Add leading zeros to sub two digit numbers on both minutes and seconds
	hours = hours < 10 ? '0' + hours : hours
	minutes = minutes < 10 ? '0' + minutes : minutes
	seconds = seconds < 10 ? '0' + seconds : seconds

	// Set the HTML Element value
	currentTask.querySelector(
		'.total-time'
	).innerHTML = `${hours}:${minutes}:${seconds}`

	// Add 1 to time
	time++
}

//--------------------------//
//	Utility Functions		//
//--------------------------//

function fadeIn(elem, highlight) {

	// Add hide class
	elem.classList.add('hide')

	// Add highlight, if present
	if (highlight != null) {
		elem.classList.add('highlight')
	}

	// Set time out for 0.26 seconds
	setTimeout(() => {
		elem.classList.remove('hide')
	}, 260);

}

function fadeOut(elem) {

	// Add highlight, if present
	if (highlight != null) {
		elem.classList.add('highlight')
	}

	// Set time out for 0.26 seconds
	setTimeout(() => {
		// Add hide class
		elem.classList.add('hide')
	}, 260);

}

//--------------------------//
//	Run on Launch			//
//--------------------------//

//--------------------------//
//	Testing					//
//--------------------------//
