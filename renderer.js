// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.

//--------------------------//
// Required Packages		//
//--------------------------//

// const electron = require('electron')
// const { ipcRenderer } = electron

//--------------------------//
// Modules					//
//--------------------------//

//--------------------------//
// Document Elements		//
//--------------------------//

const elemArchivedList = document.getElementById('archived-list')
const elemCountdown = document.getElementById('timer')
const elemTaskList = document.getElementById('project-list')
const elemSettings = document.getElementById('settings')
const tmplModalArchiveDelete = document.getElementById('modal-archive-delete')
const tmplModalCreateEdit = document.getElementById('modal-create-edit')
const tmplModalSettings = document.getElementById('modal-settings')
const tmplModal = document.getElementById('modal')
const tmplListItem = document.getElementById('list-item')
const tmplArchivedListItem = document.getElementById('archived-list-item')

//--------------------------//
//	Variables				//
//--------------------------//

let interval = null
let modalState = null
let activeTask = null
let activeTaskTime = 0
let currentTask = {
	id: null,
	task: "",
	project: "",
	client: "",
	time: 0,
	startDate: "",
	archived: false
}
let localCache = {
	tasks: {},
	clients: {},
	currentNewID: 0,
	settings: {}
}

//--------------------------//
//	Event Listeners			//
//--------------------------//

document.addEventListener('click', function (event) {

	// Play Event
	if (event.target.matches('#play')) {

		// Check to see if another interval is running
		if (activeTask != null) {

			// If one is, kill it
			intervalStop(activeTask)
		}

		// Set the current task
		activeTask = event.target.parentElement.parentElement

		// Get the current task's current time
		let timeArray = activeTask
			.querySelector('.total-time')
			.innerText.split(':')

			activeTaskTime = timeArray[0] * 60 * 60 + timeArray[1] * 60 + timeArray[2] * 1

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
		activeTask.classList.add('highlight', 'active')

		return
	}

	// Stop Event
	if (event.target.matches('#stop')) {

		// Save active task time to current task
		currentTask = localCache.tasks[activeTask.id]
		console.log(currentTask)
		currentTask.time = activeTaskTime

		// Save current task to local cache
		localCache.tasks[activeTask.id] = currentTask

		// Save local cache to local storage
		ipcRenderer.send('db:send', localCache)

		// Stop the interval
		intervalStop(activeTask)

		return
	}

	// Add Event
	if (event.target.matches('#add')) {

		// Set modal state
		modalState = 'create'

		// Launch modal
		modalLaunchCreateEdit(localCache.currentNewID)

		return
	}

	// Edit Event
	if (event.target.matches('#edit')) {
		// Set the modal state
		modalState = 'edit'

		// Get task ID
		let taskId = event.target.parentElement.parentElement.id

		// Set current task
		currentTask = localCache.tasks[taskId]

		// Launch modal
		modalLaunchCreateEdit(taskId)

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

		// Launch modal
		modalLaunchArchiveDelete(event.target.parentElement.parentElement.id)

		return
	}

	// Archive Event
	if (event.target.matches('#reinstate')) {

		// Set the modal state
		modalState = 'reinstate'

		// Launch modal
		modalLaunchReinstate(event.target.parentElement.parentElement.id)

		return
	}

	// Delete Event
	if (event.target.matches('#delete')) {

		// Set the modal state
		modalState = 'delete'

		// Launch modal
		modalLaunchArchiveDelete(event.target.parentElement.parentElement.id)

		return
	}

	// Modal - Save Event
	if (event.target.matches('#modalSaveCreateEdit')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		// Handle create/edit functionalities
		if (modalState === 'create') {

			// Save the current values to the db
			saveTaskToDB(event.target, modalContainer.getAttribute('data-task-id'))

		} else if (modalState === 'edit') {

			// Save the current values to the db
			saveTaskToDB(event.target, modalContainer.getAttribute('data-task-id'))

		}

		// Close the modal
		modalClose(modalContainer)

		return
	}

	// Modal - Cancel Event
	if (event.target.matches('#modalCancel')) {

		// Close the modal
		modalClose(event.target.parentElement.parentElement.parentElement)

		// Reset current task
		resetCurrentTask()

		return
	}

	// Modal - Yes Event
	if (event.target.matches('#modalYesArchiveDelete')) {

		// Set the modal container variable
		let modalContainer =
			event.target.parentElement.parentElement.parentElement

		if (modalState === 'archive') {

			// Archive current task
			archiveNode(modalContainer.dataset.taskId)
		}

		if (modalState === 'reinstate') {

			// Archive current task
			reinstateNode(modalContainer.dataset.taskId)
		}

		if (modalState === 'delete') {

			// Delete current task
			deleteTask(modalContainer.dataset.taskId)
		}

		// Close the modal
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
		modalLaunchSettings('settings')

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

function archiveNode(id) {

	// Change the task archive status to true
	localCache.tasks[id].archived = true

	// Send local cache to db
	ipcRenderer.send('db:send', localCache)

	// Clone task template
	let taskTmplClone = tmplArchivedListItem.content.cloneNode(true)
	let taskTmpl = taskTmplClone.querySelector('.list-item')

	// Format the task date and time
	const startDate = formatDateForHTML(localCache.tasks[id].startDate)
	const formattedTime = formatTimeForHTML(localCache.tasks[id].time)

	// Set archived task values in UI
	taskTmpl.id = id
	taskTmpl.querySelector('.task').innerText = localCache.tasks[id].task
	taskTmpl.querySelector('.project').innerText = localCache.tasks[id].project
	taskTmpl.querySelector('.client').innerText = localCache.tasks[id].client
	taskTmpl.querySelector('.total-time').innerText = formattedTime
	taskTmpl.querySelector('.start-date').innerText = startDate
	taskTmpl.dataset.archived = 'true'

	// Add hide class from cloned node
	taskTmpl.classList.add('hide')

	// Append clone to project list
	elemArchivedList.appendChild(taskTmpl)

	// Set time out for 0.125 seconds
	setTimeout(() => {

		// Remove hide class from cloned node
		taskTmpl.classList.remove('hide')

	}, 250)
}

function reinstateNode(id) {

	// Change the task archive status to true
	localCache.tasks[id].archived = false

	// Send local cache to db
	ipcRenderer.send('db:send', localCache)

	// Clone task template
	let taskTmplClone = tmplListItem.content.cloneNode(true)
	let taskTmpl = taskTmplClone.querySelector('.list-item')

	// Format the task date and time
	const startDate = formatDateForHTML(localCache.tasks[id].startDate)
	const formattedTime = formatTimeForHTML(localCache.tasks[id].time)

	// Set archived task values in UI
	taskTmpl.id = id
	taskTmpl.querySelector('.task').innerText = localCache.tasks[id].task
	taskTmpl.querySelector('.project').innerText = localCache.tasks[id].project
	taskTmpl.querySelector('.client').innerText = localCache.tasks[id].client
	taskTmpl.querySelector('.total-time').innerText = formattedTime
	taskTmpl.querySelector('.start-date').innerText = startDate
	taskTmpl.dataset.archived = 'true'

	// Add hide class from cloned node
	taskTmpl.classList.add('hide')

	// Append clone to project list
	elemTaskList.appendChild(taskTmpl)

	// Set time out for 0.125 seconds
	setTimeout(() => {

		// Remove hide class from cloned node
		taskTmpl.classList.remove('hide')

	}, 250)
}

function deleteTask(target) {

	const taskElem = document.getElementById(target)

	// Change background color and hide out
	taskElem.classList.add('highlight', 'delete')
	taskElem.classList.add('hide')

	// After 0.6 seconds remove the node
	setTimeout(() => {

		// Removed from DOM tree
		taskElem.remove()

		// Delete the task from the local cache
		delete localCache.tasks[target]

		// Send local cache to db
		ipcRenderer.send('db:send', localCache)

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
		node.id = localCache.currentNewID

		// Add class to clone node
		node.classList.add('hide')

		// Append clone to project list
		elemTaskList.appendChild(node)

		// Increase current id
		increaseCurrentNewID()

		// Set time out for 0.1 seconds
		setTimeout(() => {
			// Remove class to clone node
			node.classList.remove('hide')
		}, 100)
	}, 250)

}

function formatDateForHTML(date) {

	const dateObj = new Date(date)

	// Setting display day, month, and year
	let dateDay = dateObj.getDate()
	let dateMonth = dateObj.getMonth() + 1
	const dateYear = dateObj.getFullYear()

	// adding preceding zeros as needed
	if (dateDay < 10) {
		dateDay = `0${dateDay}`
	}
	if (dateMonth < 10) {
		dateMonth = `0${dateMonth}`
	}

	// return display date
	return `${dateMonth}-${dateDay}-${dateYear}`

}

function formatTimeForHTML(time) {

	// Set minutes/seconds to current time
	let hours = Math.floor(time / 3600)
	let minutes = Math.floor((time - hours * 3600) / 60)
	let seconds = time % 60

	// Add leading zeros to sub two digit numbers on both minutes and seconds
	hours = hours < 10 ? '0' + hours : hours
	minutes = minutes < 10 ? '0' + minutes : minutes
	seconds = seconds < 10 ? '0' + seconds : seconds

	// Set the HTML Element value
	return `${hours}:${minutes}:${seconds}`

}

function increaseCurrentNewID() {

	// Update local variable
	localCache.currentNewID++

	// Update the JSON file
	ipcRenderer.send('db:send', localCache)
}

function intervalStop(target) {

	// Reset current task
	activeTask = null

	// Change class and id
	target.querySelector('.time-controls > i').classList = 'ri-play-fill ri-xl'
	target.querySelector('.time-controls > i').id = 'play'

	// Stop the interval loop
	clearInterval(interval)

	// Remove the highlight class to this item
	target.classList.remove('highlight', 'active')
}

function modalLaunchArchiveDelete(id) {

	// Get template and clone it
	const cloneTmpl = tmplModalArchiveDelete.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.modal-container')

	// Set clone's id
	clone.setAttribute('data-task-id', id)

	// If modal is a delete modal
	if (modalState === 'delete') {

		// Change the form title
		clone.querySelector('h2').innerHTML = 'Delete Task'
		clone.querySelector('p').innerHTML = 'Do you want to delete this task? This cannot be undone.'

	} else if (modalState === 'reinstate') {

		// Change the form title
		clone.querySelector('h2').innerHTML = 'Reinstate Task'
		clone.querySelector('p').innerHTML = 'Do you want to reinstate this task?'

	}

	// Append the modal clone to the body
	document.body.prepend(cloneTmpl)

	// Take 0.1 seconds and remove hide
	setTimeout(() => {
		// Remove class to clone node
		clone.classList.remove('hide')
	}, 100)

	return

}

function modalLaunchReinstate(id) {

	// Get template and clone it
	const cloneTmpl = tmplModalArchiveDelete.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.modal-container')

	// Change the form title
	clone.querySelector('h2').innerHTML = 'Reinstate Task'
	clone.querySelector('p').innerHTML = 'Do you want to reinstate this task?'

	// Set clone's id
	clone.setAttribute('data-task-id', id)

	// Append the modal clone to the body
	document.body.prepend(cloneTmpl)

	// Take 0.1 seconds and remove hide
	setTimeout(() => {
		// Remove class to clone node
		clone.classList.remove('hide')
	}, 100)

	return

}

function modalLaunchCreateEdit(id) {

	// Get template and clone it
	const cloneTmpl = tmplModalCreateEdit.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.modal-container')

	// Set clone's id
	clone.setAttribute('data-task-id', id)

	// If modal is an edit modal
	if (modalState === 'edit') {

		// Get the task we're editing
		const task = document.getElementById(id)

		// Set current task
		currentTask = {
			id: id,
			task: task.querySelector('.task').innerText,
			project: task.querySelector('.project').innerText,
			client: task.querySelector('.client').innerText,
			time: task.querySelector('.total-time').innerText,
			startDate: task.querySelector('.start-date').innerText,
			archived: false
		}

		// Change the form title
		clone.querySelector('h2').innerHTML = 'Edit Task'

		// Set the form values to the current values
		clone.querySelector('[name=task]').value = currentTask.task
		clone.querySelector('[name=project]').value = currentTask.project
		clone.querySelector('[name=client]').value = currentTask.client
	}

	// Append the clone to the body
	document.body.prepend(cloneTmpl)

	// Take 0.1 seconds and remove hide
	setTimeout(() => {
		// Remove class to clone node
		clone.classList.remove('hide')
	}, 100)

	return
}

function modalLaunchSettings() {

	// Get template and clone it
	const cloneTmpl = tmplModalSettings.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.modal-container')

	// Append the clone to the body
	document.body.prepend(cloneTmpl)

	// Take 0.1 seconds and remove hide
	setTimeout(() => {
		// Remove class to clone node
		clone.classList.remove('hide')
	}, 100)

	return
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

function resetCurrentTask() {

	// Reset current task
	currentTask = {
		id: null,
		task: "",
		project: "",
		client: "",
		time: 0,
		startDate: "",
		archived: false
	}

	return
}

function saveTaskToDB(target, id) {

	console.log(modalState)

	// Set form location
	const form = target.parentElement.parentElement

	// Get current date/time
	let fullDate = new Date()

	// Set Current Task
	currentTask = {
		id: parseInt(id, 10),
		task: form.querySelector('[name=task]').value,
		project: form.querySelector('[name=project]').value,
		client: form.querySelector('[name=client]').value,
		time: 0,
		startDate: fullDate,
		archived: false
	}

	// Add current task to cached tasks
	localCache.tasks[currentTask.id] = currentTask

	console.log(localCache.tasks)

	// Run the correct function
	if (modalState === 'create') {

		// Increase current new ID
		increaseCurrentNewID()

		// Add task to UI
		taskCreateUI()

	} else if (modalState === 'edit') {

		taskEdit()

	} else {

		console.error(`HOW THE ACTUAL FUCK DID YOU NOT SET THE MODAL STATE?`)

	}

	// Send task to JSON file
	ipcRenderer.send('db:send', localCache)

}

function taskCreateUI() {

	// Format the date for the UI
	const startDate = formatDateForHTML(currentTask.startDate)

	// Clone task template
	let taskTmplClone = tmplListItem.content.cloneNode(true)
	let appendElement = elemTaskList

	// Check to see if task is archived
	if (currentTask.archived) {

		// Swap cloned task template for archived task template
		taskTmplClone = tmplArchivedListItem.content.cloneNode(true)

		// Set appendElement to the archived list
		appendElement = elemArchivedList

	}

	let taskTmpl = taskTmplClone.querySelector('.list-item')

	// Set task values
	taskTmpl.id = currentTask.id
	taskTmpl.querySelector('.task').innerHTML = currentTask.task
	taskTmpl.querySelector('.project').innerHTML = currentTask.project
	taskTmpl.querySelector('.client').innerHTML = currentTask.client
	taskTmpl.querySelector(
		'.total-time'
	).innerHTML = formatTimeForHTML(currentTask.time)
	taskTmpl.querySelector(
		'.start-date'
	).innerHTML = startDate

	// Add class to clone node
	taskTmpl.classList.add('hide')

	// Append clone to appropriate list
	appendElement.appendChild(taskTmpl)

	// Set time out for 0.1 seconds
	setTimeout(() => {
		// Remove class to clone node
		taskTmpl.classList.remove('hide')
	}, 100)

	// Reset current task
	resetCurrentTask()
}

function taskEdit() {

	// Get the task we're editing
	const currentTaskElem = document.getElementById(currentTask.id)

	// Add class to clone node
	currentTaskElem.classList.add('highlight', 'edit', 'fast')

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Set the form values to the current values
		currentTaskElem.querySelector('.task').innerText = currentTask.task
		currentTaskElem.querySelector('.project').innerText = currentTask.project
		currentTaskElem.querySelector('.client').innerText = currentTask.client

		// Set time out for 0.1 seconds
		setTimeout(() => {
			// Remove class to clone node
			currentTaskElem.classList.remove('highlight', 'edit', 'fast')
		}, 100)
	}, 125)
}

function updateCountdown() {

	const currentTime = formatTimeForHTML(activeTaskTime)

	// Set the HTML Element value
	activeTask.querySelector('.total-time').innerHTML = currentTime

	// Add 1 to time
	activeTaskTime++
}

function updateTaskList() {

	// Clear current task list and archived list
	document.querySelectorAll('.list-item').forEach(item => {
		item.remove()
	})

	// Set taskList
	const taskList = localCache.tasks

	// Loop through the task list
	for (const task in taskList) {
		if (Object.hasOwnProperty.call(taskList, task)) {

			currentTask = {
				id: taskList[task].id,
				task: taskList[task].task,
				project: taskList[task].project,
				client: taskList[task].client,
				time: taskList[task].time,
				startDate: taskList[task].startDate,
				archived: taskList[task].archived
			}

			// Check to see if task is archived or not
			if (currentTask.archived === false) {

				// Create the task
				taskCreateUI()

			} else {

				// Archive the task
				taskCreateUI()

			}

			// Reset current task
			resetCurrentTask()
		}
	}
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

function parseJSONtoObj(jsonString) {
	return JSON.parse(jsonString)
}

//--------------------------------------//
//	contextBridge/ipcRenderer Methods	//
//--------------------------------------//

// Set local cache using returned values
window.api.onJSONReturn( (json) => {

		// Set task list variable
		localCache.tasks = JSON.parse(json).tasks
		localCache.clients = JSON.parse(json).clients
		localCache.currentNewID = JSON.parse(json).currentNewID
		localCache.settings = JSON.parse(json).settings

		// Update the UI
		updateTaskList()

	}
)

//--------------------------//
//	Run on Launch			//
//--------------------------//

// Get db dump on load
ipcRenderer.send('db:get', '')

//--------------------------//
//	Testing					//
//--------------------------//

// Get tasks from JSON file via Electron app
// TODO ipcRenderer.send('task:update', task)
// TODO ipcRenderer.send('task:delete', task)
// TODO ipcRenderer.send('client:get')
// TODO ipcRenderer.send('client:update', client)
// TODO ipcRenderer.send('client:delete', client)
// TODO ipcRenderer.send('currentNewID:get')
// TODO ipcRenderer.send('settings:get')
// TODO ipcRenderer.send('settings:update', setting)
