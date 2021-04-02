// PROVIDED CODE BELOW (LINES 1 - 80) DO NOT REMOVE

// The store will hold all information needed globally
var store = {
	track_id: undefined,
	player_id: undefined,
	race_id: undefined,
	track_name: undefined
}

// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
	onPageLoad()
	setupClickHandlers()
})

async function onPageLoad() {
	try {
		getTracks()
			.then(tracks => {
				const html = renderTrackCards(tracks)
				renderAt('#tracks', html)
			})
			.catch(err => console.log( err))

		getRacers()
			.then((racers) => {
				const html = renderRacerCars(racers)
				renderAt('#racers', html)
			})
			.catch(err => console.log( err))
	} catch(error) {
		console.log("Problem getting tracks and racers ::", error.message)
		console.error(error)
	}
}

function setupClickHandlers() {
	document.addEventListener('click', function(event) {
		const { target } = event

		// Race track form field
		if (target.matches('.card.track')) {
			handleSelectTrack(target)
		}

		// Podracer form field
		if (target.matches('.card.podracer')) {
			handleSelectPodRacer(target)
		}

		// Submit create race form
		if (target.matches('#submit-create-race')) {
			event.preventDefault()
			// start race
			handleCreateRace()
		}

		// Handle acceleration click
		if (target.matches('#gas-peddle')) {
			handleAccelerate(target)
		}
	}, false)
}

async function delay(ms) {
	try {
		return await new Promise(resolve => setTimeout(resolve, ms));
	} catch(error) {
		console.log("an error shouldn't be possible here")
		console.log(error)
	}
}
// ^ PROVIDED CODE ^ DO NOT REMOVE

// This async function controls the flow of the race, add the logic and error handling
async function handleCreateRace() {
	renderAt('#race', renderRaceStartView())
	// Get player_id and track_id from the store
	const trackId = parseInt(store.track_id);
	const playerId = parseInt(store.player_id);
	// Invoke the API call to create the race, then save the result
	createRace(playerId, trackId)
	.then(data => {
		const race = data;
		// update the store with the race id
    	store.race_id = parseInt(race.ID);
		return race;
	})
	.catch(err => console.log( err))
	// The race has been created, now start the countdown
	// Call the async function runCountdown
	.then(race => {
		// render starting UI
		runCountdown(race);
		return race;
	})
	.catch(err => console.log( err))
	.then(data => {
		// Call the async function runRace
		runRace(parseInt(data.ID));
		return data;
	})
	.catch(err => console.log( err))
}

function runRace(raceID) {
	return new Promise(resolve => {
	// Use Javascript's built in setInterval method to get race info every 500ms
	const getCurrentRace = () => {
 		getRace(raceID-1)
 		.then(res => {
	 		if(res.status === 'in-progress') {
				//if the race info status property is "in-progress", update the leaderboard
				renderAt('#leaderBoard', raceProgress(res.positions))
			}
			else if (res.status === 'finished') {
				//if the race info status property is "finished"
				clearInterval(raceInterval) // to stop the interval from repeating
				renderAt('#race', resultsView(res.positions)) // to render the results view
				resolve(res); // resolve the promise
			}
 		})
		.catch(err => console.log(err))
	}
	let raceInterval = setInterval(getCurrentRace, 500);
	})
	// add error handling for the Promise
	.catch(err => console.log(err))
}

async function runCountdown(race) {
	try {
		// wait for the DOM to load
		await delay(1000)
		let timer = 3

		return new Promise(resolve => {
		// Use Javascript's built in setInterval method to count down once per second
		// Run this DOM manipulation to decrement the countdown for the user
		//https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve
		//Reference last edited Feb 19, 2021, by MDN contributors - referenced by MM 4/1/21
			const reduceTimer = () => {
				if(document.getElementById('big-numbers')) {
					document.getElementById('big-numbers').innerHTML = --timer
				}
				if(timer === 0) {
					// if the countdown is done, clear the interval, resolve the promise, and return
					clearInterval(count);
					startRace(parseInt(race.ID - 1))
					resolve(count)
				}
			}

			let count = setInterval(reduceTimer, 1000);
			return race;
		})
	} catch(error) {
		console.log(error);
	}
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target.id)

	// remove class selected from all racer options
	const selected = document.querySelector('#racers .selected')
	if(selected) {
		selected.classList.remove('selected')
	}

	// add class selected to current target
	target.classList.add('selected')

	// Save the selected racer to the store
	store.player_id = target.id;
}

function handleSelectTrack(target) {
	console.log("selected a track", target.id)

	// remove class selected from all track options
	const selected = document.querySelector('#tracks .selected')
	if(selected) {
		selected.classList.remove('selected')
	}
	// add class selected to current target
	target.classList.add('selected')
	// Save the selected track id and track name to the store
	store.track_id = target.id;
	store.track_name = target.textContent.trim();
}

function handleAccelerate() {
	//Invoke the API call to accelerate
	const raceId = store.race_id - 1;
	getRace(raceId-1)
    .then(res => {
		//if the race still in progress, call accelerate to post data
		if(res.status !== 'finished') {
			accelerate(parseInt(raceId))
		}
	})
	.catch(err => console.log( err))
}

// HTML VIEWS ------------------------------------------------
// Provided code - do not remove

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`
	}

	const results = racers.map(renderRacerCard).join('')

	return `
		<ul id="racers">
			${results}
		</ul>
	`
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer
	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`
	}
	const results = tracks.map(renderTrackCard).join('')

	return `
		<ul id="tracks">
			${results}
		</ul>
	`
}

function renderTrackCard(track) {
	const { id, name } = track
	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`
}

function renderCountdown(count) {
	return `
		<h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`
}

function renderRaceStartView(track) {
	track = store;
	return `
		<header>
			<h1>Race: ${track.track_name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position) ? 1 : -1)

	return `
		<header class="results-header">
			<h1>Race Results</h1>

		</header>
		<main class="results">
		<div class="final-results">
			${raceProgress(positions)}
		</div>
			<a class="button" href="/race">Start a new race</a>
		</main>
	`
}

function raceProgress(positions) {

	let userPlayer;
	positions.forEach(a => {
		if(a.id == store.player_id) {
			userPlayer = a;
		}
	})
	userPlayer.driver_name += " (you)"

	positions = positions.sort((a, b) => (a.segment > b.segment) ? -1 : 1)
	let count = 1

	const results = positions.map(p => {
		return `
			<tr>
				<td>
					<h3>${count++} - ${p.driver_name}</h3>
				</td>
			</tr>
		`
	})

	return `
		<main>
			<h3>Leaderboard</h3>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`
}

function renderAt(element, html) {
	const node = document.querySelector(element)

	node.innerHTML = html
}

// ^ Provided code ^ do not remove


// API CALLS ------------------------------------------------

const SERVER = 'http://localhost:8000'

function defaultFetchOpts() {
	return {
		mode: 'cors',
		headers: {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin' : SERVER,
		},
	}
}

//Make a fetch call (with error handling!) to each of the following API endpoints
function getTracks() {
	// GET request to `${SERVER}/api/tracks`
	return fetch(`${SERVER}/api/tracks`)
	.then(res => res.json())
	.then(data => data)
	.catch(err => console.log("Problem with getTracks request::", err))

}

function getRacers() {
	// GET request to `${SERVER}/api/cars`
	return fetch(`${SERVER}/api/cars`)
	.then(res => res.json())
	.then(data => data)
	.catch(err => console.log("Problem with getRacers request::", err))
}

function createRace(player_id, track_id) {
	player_id = parseInt(player_id)
	track_id = parseInt(track_id)
	const body = { player_id, track_id }

	return fetch(`${SERVER}/api/races`, {
		method: 'POST',
		...defaultFetchOpts(),
		dataType: 'jsonp',
		body: JSON.stringify(body)
	})
	.then(res => res.json())
	.then(data => data)
	.catch(err => console.log("Problem with createRace request::", err))
}

function getRace(id) {
	// GET request to `${SERVER}/api/races/${id}`
	return fetch(`${SERVER}/api/races/${id}`)
	.then(res => res.json())
	.then(data => data)
	.catch(err => console.log("Problem with getRace request::", err))
}

function startRace(id) {
	//https://knowledge.udacity.com/questions/438315
	//referenced this question to help fix my issue
	return fetch(`${SERVER}/api/races/${id}/start`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with startRace request::", err))
}

function accelerate(id) {
	// POST request to `${SERVER}/api/races/${id}/accelerate`
	// options parameter provided as defaultFetchOpts
	// no body or datatype needed for this request
	return fetch(`${SERVER}/api/races/${id}/accelerate`, {
		method: 'POST',
		...defaultFetchOpts(),
	})
	.catch(err => console.log("Problem with accelerate request::", err))
}
