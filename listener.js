function isAgainstBot (players) {
  return players.includes('bot')
}

function makeBotChoice (number) {
  if (number % 3 === 0) {
    return '+0'
  }

  if ((number + 1) % 3 === 0) {
    return '+1'
  }

  // Only one remaining scenario: decrease by one
  return '-1'
}

function listener (socket) {
  const players = []

  socket.emit('message', 'To start a game, emit a `start` event with your name')

  socket.on('start', (player) => {
    // Honor random number override sent as parameter
    const envOverride = Number(process.env.STARTING_NUMBER)
    const argOverride = Number(process.argv[2])
    const number = envOverride || argOverride || Math.round(Math.random() * 100)

    if (players.length === 0) {
      players.push(player, 'bot')
      socket.emit('update', {
        player,
        number
      })
    }
  })

  socket.on('move', (move) => {
    if (move.choice) {
      const number = (move.number + Number.parseInt(move.choice, 10)) / 3
      if (number === 1) {
        socket.emit('end')
      }

      socket.emit('update', { ...move, number })

      if (isAgainstBot(players)) {
        const botChoice = makeBotChoice(number)
        socket.emit('update', {
          player: 'bot',
          choice: botChoice,
          number: number + Number.parseInt(botChoice, 10)
        })
      }
    }
  })
}

module.exports = listener
