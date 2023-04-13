const BOT = 'Bot'

function isBotPlaying (players) {
  return players.includes(BOT)
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

function isGameOver (number) {
  return number === 1
}

function listener (socket) {
  const players = []

  function makeBotMove (number) {
    const botChoice = makeBotChoice(number)
    const details = {
      player: BOT,
      choice: botChoice,
      number: (number + Number.parseInt(botChoice, 10)) / 3
    }

    socket.emit('update', details)
    if (isGameOver(details.number)) {
      socket.emit('end')
    }
  }

  socket.emit('message', 'To start a game, emit a `start` event with your name')

  socket.on('start', (player) => {
    // Honor random number override sent as parameter
    const envOverride = Number(process.env.STARTING_NUMBER)
    const argOverride = Number(process.argv[2])
    const number = envOverride || argOverride || Math.round(Math.random() * 100)

    socket.emit('update', {
      player,
      number
    })

    if (!isBotPlaying(players)) {
      players.push(player, BOT)
      makeBotMove(number)
    }
  })

  socket.on('move', (move) => {
    if (!move.choice) {
      return
    }

    const number = (move.number + Number.parseInt(move.choice, 10)) / 3
    socket.emit('update', { ...move, number })

    if (isGameOver(number)) {
      socket.emit('end')
      return
    }

    if (isBotPlaying(players)) {
      makeBotMove(number)
    }
  })
}

module.exports = listener
