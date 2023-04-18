/* eslint-disable no-undef */
'use strict'

const timeline = document.getElementById('timeline')
let localPlayer
let currentNumber
let autoMove

function addToTimeline (str) {
  timeline.value += '> '
  timeline.value += typeof str === 'string' ? str : JSON.stringify(str)
  timeline.value += '\n'
  timeline.scrollTop = timeline.scrollHeight
}

function clearTimeline () {
  timeline.value = ''
}

function move (choice) {
  socket.emit('move', choice)
  clearTimeout(autoMove)
}

// Computes a valid move and performs it after 10 seconds
function scheduleMove (number) {
  clearTimeout(autoMove)
  autoMove = setTimeout(() => {
    if (number % 3 === 0) {
      move('+0')
      return
    }

    if ((number + 1) % 3 === 0) {
      move('+1')
      return
    }

    move('-1')
  }, 10000)
}

window.onload = clearTimeline

document.getElementById('start')
  .addEventListener('click', () => {
    const playerInput = document.getElementById('player')
    if (!playerInput.value) {
      alert('Set a player name to start')
      return
    }

    const multiplayerRadio = document.getElementById('multi')

    socket.emit('start', playerInput.value, {
      multiplayer: multiplayerRadio.checked
    })

    localPlayer = playerInput.value
  })

document.getElementById('leave')
  .addEventListener('click', () => socket.emit('leave'))

document.getElementById('move-decrease')
  .addEventListener('click', () => move('-1'))

document.getElementById('move-stay')
  .addEventListener('click', () => move('+0'))

document.getElementById('move-increase')
  .addEventListener('click', () => move('+1'))

document.getElementById('clear')
  .addEventListener('click', clearTimeline)

const socket = io({
  auth: {
    token: Date.now().toString(36)
  }
})

socket.on('message', (message) => {
  // Filter out initial instructions
  if (message.startsWith('To start a game')) {
    return
  }

  addToTimeline(message)
})

socket.on('update', (details) => {
  const { player, number, choice } = details
  currentNumber = number

  if (!details.choice) {
    addToTimeline(`${player} sends the number ${number}.`)
  } else {
    addToTimeline(`${player} added ${choice} and sends the number ${number}.`)
  }

  // On oponent moves, start a timer for auto-moves
  if (player !== localPlayer) {
    scheduleMove(number)
  }
})

socket.on('error', (error) => {
  addToTimeline(error.message)

  // Do not halt after invalid player inputs
  if (error.name === 'InvalidInput') {
    scheduleMove(currentNumber)
  }
})

socket.on('end', (winner) => {
  if (!winner) {
    addToTimeline('The game was cancelled.')
  } else {
    addToTimeline(`${winner} wins!`)
  }
})
