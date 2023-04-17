/* eslint-disable no-undef */
'use strict'

const timeline = document.getElementById('timeline')

function addToTimeline (str) {
  timeline.value += '> '
  timeline.value += typeof str === 'string' ? str : JSON.stringify(str)
  timeline.value += '\n'
  timeline.scrollTop = timeline.scrollHeight
}

window.onload = () => {
  timeline.value = ''
}

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
  })

document.getElementById('move-decrease')
  .addEventListener('click', () => {
    socket.emit('move', '-1')
  })

document.getElementById('move-stay')
  .addEventListener('click', () => {
    socket.emit('move', '+0')
  })

document.getElementById('move-increase')
  .addEventListener('click', () => {
    socket.emit('move', '+1')
  })

document.getElementById('clear')
  .addEventListener('click', () => {
    timeline.value = ''
  })

const socket = io({
  auth: {
    token: Date.now().toString(36)
  }
})

socket.on('message', (message) => {
  if (message.startsWith('To start a game')) {
    return
  }

  addToTimeline(message)
})

socket.on('update', (details) => {
  const { player, number, choice } = details
  if (!details.choice) {
    addToTimeline(`${player} sends the number ${number}.`)
    return
  }

  addToTimeline(`${player} added ${choice} and sends the number ${number}.`)
})

socket.on('error', (error) => {
  addToTimeline(error.message)
})

socket.on('end', (winner) => {
  if (!winner) {
    addToTimeline('The game was cancelled.')
  } else {
    addToTimeline(`${winner} wins!`)
  }
})
