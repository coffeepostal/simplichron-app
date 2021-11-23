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
const tmplModalAddRemoveTime = document.getElementById('modal-add-remove-time')
const tmplModalCreateEdit = document.getElementById('modal-create-edit')
const tmplModalSettings = document.getElementById('modal-settings')
const tmplModal = document.getElementById('modal')
const tmplListItem = document.getElementById('list-item')
const tmplArchivedListItem = document.getElementById('archived-list-item')
const tmplMessage = document.getElementById('message')

//--------------------------//
//	Variables				//
//--------------------------//

let interval = null
let modalState = null
let activeTask = null
let activeTaskStartDate = null
let activeTaskEndDate = null
let activeTaskTime = 0
let currentTask = {
	id: null,
	task: '',
	project: '',
	client: '',
	time: 0,
	startDate: '',
	timerLogs: [],
	archived: false,
}
let localCache = {
	tasks: {},
	clients: [],
	currentNewID: 0,
	settings: {},
}

//--------------------------//
//	Event Listeners			//
//--------------------------//

document.addEventListener(
	'click',
	function (event) {
		console.log(event.target)

		// Play Event
		if (event.target.matches('#play')) {

			// Check to see if another interval is running
			if (activeTask != null) {

				// If one is, stop the UI timer
				intervalStop(activeTask)


				// If one is, kill it
				eventStop(activeTask)

			}

			// Run the play function
			eventPlay(event)

			return
		}

		// Stop Event
		if (event.target.matches('#stop')) {

			eventStop(activeTask)

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

		// Add/Remove Time Event
		if (event.target.matches('#addRemoveTime')) {
			// Set the modal state
			modalState = 'addRemoveTime'

			// Get task ID
			let taskId = event.target.parentElement.parentElement.id

			// Set current task
			currentTask = localCache.tasks[taskId]

			// Launch modal
			modalLaunchAddRemoveTime(taskId)

			return
		}

		// Quick Add/Remove Time Event
		if (event.target.matches('.quickModifyTime')) {
			// Get Modal Element
			const modalElem =
				event.target.parentElement.parentElement.parentElement
					.parentElement

			// Get task ID
			const taskId = modalElem.dataset.taskId

			// Get time modificaiton
			const timeModification =
				parseInt(event.target.dataset.modifyTime) * 60

			// Get current task time
			let currentTime = currentTask.time

			// If current time is somehow NaN
			if (isNaN(currentTime)) {
				currentTime = 0
			}

			// Set modified time
			let modifedTime = parseInt(currentTime) + timeModification

			// If the modification goes negative, set it to 0
			if (modifedTime < 0) {
				modifedTime = 0
			}

			// Set current task time
			currentTask.time = modifedTime

			// Get time from local cache formatted for HTML
			const formattedTime = formatTimeForHTML(modifedTime)

			// Set the form values to the current values
			modalElem.querySelector('[name=timeHours]').value = formattedTime[0]
			modalElem.querySelector('[name=timeMinutes]').value =
				formattedTime[1]
			modalElem.querySelector('[name=timeSeconds]').value =
				formattedTime[2]

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

			// Set modal state
			modalState = 'create'

			// Duplicate current node
			duplicateNode(event.target.parentElement.parentElement)

			return
		}

		// Archive Event
		if (event.target.matches('#archive')) {
			// Set the modal state
			modalState = 'archive'

			// Launch modal
			modalLaunchArchiveDelete(
				event.target.parentElement.parentElement.id
			)

			return
		}

		// Reinstate Event
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
			modalLaunchArchiveDelete(
				event.target.parentElement.parentElement.id
			)

			return
		}

		// Modal - Save Event
		if (event.target.matches('#modalSaveCreateEdit')) {
			// Set the modal container variable
			let modalContainer =
				event.target.parentElement.parentElement.parentElement

			// Set form location
			const form = modalContainer.querySelector('.form')

			// Handle create/edit functionalities
			if (modalState === 'addRemoveTime') {

				// Format time for JSON
				const formattedTime = formatTimeForJSON(
					form.querySelector('[name=timeHours]').value,
					form.querySelector('[name=timeMinutes]').value,
					form.querySelector('[name=timeSeconds]').value
				)

				// Set Current Task's time to formatted time
				currentTask.time = formattedTime

			} else if (modalState === 'create') {

				// Get current date/time
				let fullDate = new Date()

				// Set Current Task
				currentTask = {
					id: localCache.currentNewID,
					task: form.querySelector('[name=task]').value,
					project: form.querySelector('[name=project]').value,
					client: form.querySelector('[name=client]').value,
					time: 0,
					timerLogs: [],
					startDate: fullDate,
					archived: false,
				}

				// Post to message system
				messageSystem('save', 5, `'${currentTask.task}' has been created.`)

			} else if (modalState === 'edit') {

				// Set Current Task changes
				currentTask.task = form.querySelector('[name=task]').value
				currentTask.project = form.querySelector('[name=project]').value
				currentTask.client = form.querySelector('[name=client]').value

				// Post to message system
				messageSystem('edit', 5, `'${currentTask.task}' has been edited.`)

			}

			// Save the current values to the db
			saveTaskToDB()

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

		// TESTING Event
		if (event.target.matches('#test')) {

			messageSystem('error', 30, 'This is a test error message')

			return
		}

		// TESTING Event - Close
		if (event.target.matches('#message-close')) {

			// Add class to clone node
			event.target.parentElement.parentElement.classList.add('hide')

			// Take 0.1 seconds and remove hide
			setTimeout(() => {

				// Remove clone from DOM tree
				event.target.parentElement.parentElement.remove()

			}, 100)

			return
		}
	},
	false
)

//--------------------------//
//	Event Functions			//
//--------------------------//

function eventPlay(event) {

	// Set the active task
	activeTask = event.target.parentElement.parentElement

	// Run UI Timer function every second (1000 milliseconds)
	interval = setInterval(updateUITimer, 1000)

	// Set the active task's start date
	activeTaskStartDate = new Date()

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

function eventStop(activeTask) {

	// Stop the interval
	intervalStop(activeTask)

	// Set the active task's end date
	activeTaskEndDate = new Date()

	// Subtract the start date from the end date
	const timeDiff = Math.floor((activeTaskEndDate - activeTaskStartDate) /1000)

	// Save active task time to current task
	currentTask = localCache.tasks[activeTask.id]

	// Add the time difference to the current task's time
	currentTask.time = currentTask.time + timeDiff

	// Add log to current task
	currentTask.timerLogs.push({
		startDate: activeTaskStartDate,
		endDate: activeTaskEndDate,
		time: timeDiff
	})

	// Save current task to local cache
	localCache.tasks[activeTask.id] = currentTask

	// Save local cache to local storage
	ipcRenderer.send('db:send', localCache)

	// Update the UI
	taskEditUI()

	// Reset the active task
	activeTask = null

	return
}


//--------------------------//
//	Messaging Functions		//
//--------------------------//

function messageSystem(type, timeoutLength, text) {

	// Get template and clone it
	const cloneTmpl = tmplMessage.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.message-container')

	// Set clone message type
	clone.classList.add(type)

	// Change the form title
	clone.querySelector('.message-content p').innerHTML = text

	// Append the clone to the body
	document.body.prepend(cloneTmpl)

	// Take 0.1 seconds and remove hide
	setTimeout(() => {
		// Remove class to clone node
		clone.classList.remove('hide')
	}, 100)

	// Set actual timeout length
	const timeout = timeoutLength * 1000

	// Set time out for 5 seconds, then destroy the clone
	setTimeout(() => {

		// Add class to clone node
		clone.classList.add('hide')

		// Take 0.1 seconds and remove hide
		setTimeout(() => {

			// Remove clone from DOM tree
			clone.remove()

		}, 100)

	}, timeout)

	return
}


//--------------------------//
//	Task Functions			//
//--------------------------//

function archiveNode(id) {
	// Set unarchived element variable
	let unarchivedElement = document.getElementById(id)

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
	taskTmpl.querySelector(
		'.total-time'
	).innerText = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`
	taskTmpl.querySelector('.start-date').innerText = startDate
	taskTmpl.dataset.archived = 'true'

	// Add hide class to cloned node and unarchived node
	taskTmpl.classList.add('hide')
	unarchivedElement.classList.add('hide')

	// Append clone to project list
	elemArchivedList.appendChild(taskTmpl)

	// Post to message system
	messageSystem('archive', 5, `'${localCache.tasks[id].task}' has been archived.`)

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Remove hide class from cloned node
		taskTmpl.classList.remove('hide')

		// Remove unarchived node from DOM
		unarchivedElement.remove()
	}, 250)
}

function reinstateNode(id) {
	// Set archived element variable
	let archivedElement = document.getElementById(id)

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
	taskTmpl.querySelector(
		'.total-time'
	).innerText = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`
	taskTmpl.querySelector('.start-date').innerText = startDate
	taskTmpl.dataset.archived = 'true'

	// Add hide class to cloned node and archived node
	taskTmpl.classList.add('hide')
	archivedElement.classList.add('hide')

	// Append clone to project list
	elemTaskList.appendChild(taskTmpl)

	// Post to message system
	messageSystem('save', 5, `'${localCache.tasks[id].task}' has been reinstated.`)

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Remove hide class from cloned node
		taskTmpl.classList.remove('hide')

		// Remove archived node from DOM
		archivedElement.remove()
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

		// Post to message system
		messageSystem('delete', 5, `'${localCache.tasks[target].task}' has been deleted.`)

		// Delete the task from the local cache
		delete localCache.tasks[target]

		// Send local cache to db
		ipcRenderer.send('db:send', localCache)

	}, 600)
}

function duplicateNode(target) {

	// Change background color
	target.classList.add('highlight', 'duplicate')

	// Set current task
	currentTask = {
		id: localCache.currentNewID,
		task: localCache.tasks[target.id].task,
		project: localCache.tasks[target.id].project,
		client: localCache.tasks[target.id].client,
		time: localCache.tasks[target.id].time,
		timerLogs: localCache.tasks[target.id].timerLogs,
		startDate: localCache.tasks[target.id].startDate,
		archived: false,
	}

	// Save local cache to db
	saveTaskToDB()

	// Post to message system
	messageSystem('save', 5, `'${currentTask.task}' has been duplicated.`)

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Remove hide class from cloned node
		target.classList.remove('highlight', 'duplicate')
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
	return [hours, minutes, seconds]
}

function formatTimeForJSON(hours, minutes, seconds) {
	const time =
		parseFloat(hours) * 3600 +
		parseFloat(minutes) * 60 +
		parseFloat(seconds)

	return time
}

function increaseCurrentNewID() {
	// Update local variable
	localCache.currentNewID++

	// Update the JSON file
	ipcRenderer.send('db:send', localCache)
}

function intervalStop(target) {
	// Reset active task
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
		clone.querySelector('p').innerHTML =
			'Do you want to delete this task? This cannot be undone.'
	} else if (modalState === 'reinstate') {
		// Change the form title
		clone.querySelector('h2').innerHTML = 'Reinstate Task'
		clone.querySelector('p').innerHTML =
			'Do you want to reinstate this task?'
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

function modalLaunchAddRemoveTime(id) {
	// Get template and clone it
	const cloneTmpl = tmplModalAddRemoveTime.content.cloneNode(true)

	// Set clone as variable
	const clone = cloneTmpl.querySelector('.modal-container')

	// Set clone's id
	clone.setAttribute('data-task-id', id)

	// Get time from local cache formatted for HTML
	const formattedTime = formatTimeForHTML(currentTask.time)

	// Set the form values to the current values
	clone.querySelector('[name=timeHours]').value = formattedTime[0]
	clone.querySelector('[name=timeMinutes]').value = formattedTime[1]
	clone.querySelector('[name=timeSeconds]').value = formattedTime[2]

	// Append the clone to the body
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
		task: '',
		project: '',
		client: '',
		time: 0,
		timerLogs: [],
		startDate: '',
		archived: false,
	}

	return
}

function saveTaskToDB() {

	// Add current task to cached tasks
	localCache.tasks[currentTask.id] = currentTask

	// Run the correct function
	if (modalState === 'create') {

		// Increase current new ID
		increaseCurrentNewID()

		// Add task to UI
		taskCreateUI()

	} else if (modalState === 'addRemoveTime' || modalState === 'edit') {
		taskEditUI()
	} else {
		// Throw error
		messageSystem('error', 30, `Modal State not set — <a href="mailto:dev@farns.co?subject=SimpliChron Error&body=Modal State not set when trying to saveTaskToDB.\n\nmodalState: ${modalState}\ncurrentTask: ${currentTask}">email the developer.</a>`)
	}

	// Create client array
	let allClientList = []

	// Loop through all tasks to get all clients
	for (const task in localCache.tasks) {
		if (Object.hasOwnProperty.call(localCache.tasks, task)) {
			const client = localCache.tasks[task].client;

			allClientList.push(client)
		}
	}

	// Set local cache clients to unique client list
	localCache.clients = [...new Set(allClientList)]

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

	// Get the task list item
	let taskTmpl = taskTmplClone.querySelector('.list-item')

	// Set time for HTML
	const formattedTime = formatTimeForHTML(currentTask.time)

	// Set task values
	taskTmpl.id = currentTask.id
	taskTmpl.querySelector('.task').innerHTML = currentTask.task
	taskTmpl.querySelector('.project').innerHTML = currentTask.project
	taskTmpl.querySelector('.client').innerHTML = currentTask.client
	taskTmpl.querySelector(
		'.total-time'
	).innerHTML = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`
	taskTmpl.querySelector('.start-date').innerHTML = startDate

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

function taskEditUI() {
	// Get the task we're editing
	const currentTaskElem = document.getElementById(currentTask.id)

	console.log(currentTaskElem)

	// Add class to clone node
	currentTaskElem.classList.add('highlight', 'edit', 'fast')

	// Set time out for 0.125 seconds
	setTimeout(() => {
		// Set time formatted for HTML
		const formattedTime = formatTimeForHTML(currentTask.time)

		// Set the form values to the current values
		currentTaskElem.querySelector('.task').innerText = currentTask.task
		currentTaskElem.querySelector('.project').innerText =
			currentTask.project
		currentTaskElem.querySelector('.client').innerText = currentTask.client
		currentTaskElem.querySelector('.current-timer').innerText = `00:00:00`
		currentTaskElem.querySelector(
			'.total-time'
		).innerText = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`

		// Set time out for 0.1 seconds
		setTimeout(() => {
			// Remove class to clone node
			currentTaskElem.classList.remove('highlight', 'edit', 'fast')

			// Reset current task
			resetCurrentTask()
		}, 100)
	}, 125)
}

function updateCountdown() {
	const formattedTime = formatTimeForHTML(activeTaskTime)

	// Set the HTML Element value
	activeTask.querySelector(
		'.total-time'
	).innerHTML = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`

	// Add 1 to time
	activeTaskTime++
}

function updateTaskList() {
	// Clear current task list and archived list
	document.querySelectorAll('.list-item').forEach((item) => {
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
				timerLogs: taskList[task].timerLogs,
				startDate: taskList[task].startDate,
				archived: taskList[task].archived,
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

function updateUITimer() {

	// Set the active task's end date
	const tempEndDate = new Date()

	// Subtract the start date from the end date
	const timeDiff = Math.floor((tempEndDate - activeTaskStartDate) /1000)

	const formattedTime = formatTimeForHTML(timeDiff)

	// Set the HTML Element value
	activeTask.querySelector(
		'.current-timer'
	).innerHTML = `${formattedTime[0]}:${formattedTime[1]}:${formattedTime[2]}`

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
	}, 260)
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
	}, 260)
}

function parseJSONtoObj(jsonString) {
	return JSON.parse(jsonString)
}

//--------------------------------------//
//	contextBridge/ipcRenderer Methods	//
//--------------------------------------//

// Set local cache using returned values
window.api.onJSONReturn((json) => {
	try {
		// If no JSON file exists don't set the local cache to null
		if (Object.keys(json).length != 0) {
			// Set task list variable
			localCache.tasks = json.tasks
			localCache.clients = json.clients
			localCache.currentNewID = json.currentNewID
			localCache.settings = json.settings

			// Update the UI
			updateTaskList()
		}
	} catch (error) {
		messageSystem('error', 30 `Error returning data: ${error} – <a href="mailto:dev@farns.co?subject=SimpliChron Error&body=Returned error while returning data from JSON.\n\n Error: ${error}">email the developer.</a>`)
	}
})

//--------------------------//
//	Run on Launch			//
//--------------------------//

// Get db dump on load
ipcRenderer.send('db:get', '')

//--------------------------//
//	Testing					//
//--------------------------//
