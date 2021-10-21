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

const countdownElem = document.getElementById('timer')
const template = document.getElementById('list-item')
const projectList = document.getElementById('project-list')

//--------------------------//
//	Variables				//
//--------------------------//

const startingMinutes = 0
let time = startingMinutes * 60
let play = false
let interval = null

//--------------------------//
//	Event Listeners			//
//--------------------------//

document.addEventListener('click', function (event) {

	// Play Event
    if (event.target.matches('#play')) {

        // // Run function every second (1000 milliseconds)
        // interval = setInterval(updateCountdown(target), 1000)

        // Change class and id of play/pause
        event.target.classList = "ri-pause-line"
        event.target.id = "pause"

        // Highlight active timer
        const listItems = document.querySelectorAll('.list-item')
        const listItemsArray = [...listItems]

		// Remove the highlight class from any other item
        listItemsArray.forEach(e => {
            e.classList.remove('highligh')
        })

		// Add the highlight class to this item
        event.target.parentElement.parentElement.classList.add('highlight')

		return
	}

	// Pause Event
	if (event.target.matches('#pause')) {

		// Stop the interval loop
		clearInterval(interval)

		// Remove the highlight class to this item
        event.target.parentElement.parentElement.classList.remove('highlight')

		// Change class and id of play/pause
		event.target.classList = "ri-play-line"
		event.target.id = 'play'

		return
	}

	// Stop Event
	if (event.target.matches('#stop')) {
		// Stop the interval loop
		clearInterval(interval)

		// Set pause element variable
		const elemPause = document.getElementById('pause')

		// Check to see if pause element exists
		if (elemPause) {
			// Change class and id of play/pause
			document.getElementById('pause').classList = "ri-play-line"
			document.getElementById('pause').id = 'play'
		}

		// Remove the highlight class to this item
        event.target.parentElement.parentElement.classList.remove('highlight')

		// Reset timer
		time = startingMinutes * 60
		countdownElem.innerHTML = `00:00`

		return
	}

	// Duplicate Event
	if (event.target.matches('#duplicate')) {

		// Remove current node
		duplicateNode(event.target.parentElement.parentElement)

		return
	}

	// Archive Event
	if (event.target.matches('#archive')) {

		// Change class and id of play/pause
        event.target.classList = "ri-question-mark"

		// Remove current node
		archiveNode(event.target.parentElement.parentElement)

		return
	}

	// Delete Event
	if (event.target.matches('#delete')) {

		// Change class and id of play/pause
        event.target.classList = "ri-question-mark"

		// Remove current node
		deleteNode(event.target.parentElement.parentElement)

		return
	}

	// Add Event
	if (event.target.matches('#add')) {

		let cloneTemplate = template.content.cloneNode(true)

		cloneTemplate.id = `id-XXXX`

		console.log(cloneTemplate)

		projectList.appendChild(cloneTemplate)

		return
	}

}, false)

//--------------------------//
//	Functions				//
//--------------------------//

function deleteNode(target) {

	// Change background color and fade out
	target.classList.add('delete-highlight')
	target.classList.add('fade')

	// After 0.6 seconds remove the node
	setTimeout(() => {
		target.remove()
	}, 600);
}

function duplicateNode(target) {
	// Change background color
	target.classList.add('duplicate-highlight')

	// After 0.25 seconds, fade out highlight color
	setTimeout(() => {

		// Change background color
		target.classList.remove('duplicate-highlight')

		// Clone target node
		let node = target.cloneNode(true)

		// Change clone node's ID
		node.id = `id-XXXX`

		// Add class to clone node
		node.classList.add('fade')

		console.log(node)

		// Append clone to project list
		projectList.appendChild(node)

		setTimeout(() => {

			// Remove class to clone node
			node.classList.remove('fade')

		}, 100);

	}, 250);
}

function updateCountdown(target) {
	// Set minutes/seconds to current time
	let minutes = Math.floor(time / 60)
	let seconds = time % 60

	// Add leading zeros to sub two digit numbers on both minutes and seconds
	minutes = minutes < 10 ? '0' + minutes : minutes
	seconds = seconds < 10 ? '0' + seconds : seconds

	// Set the HTML Element value
	countdownElem.innerHTML = `${minutes}:${seconds}`

	// Add 1 to time
	time++
}

//--------------------------//
//	Run on Launch			//
//--------------------------//

//--------------------------//
//	Testing					//
//--------------------------//