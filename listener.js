const BOT = 'bot'

function isBotPlaying (players) {
  return Boolean(players[BOT])
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
  const players = {}

  function makeBotMove (number) {
    const botChoice = makeBotChoice(number)
    const details = {
      player: players[BOT],
      choice: botChoice,
      number: (number + Number.parseInt(botChoice, 10)) / 3
    }

    socket.emit('update', details)
    if (isGameOver(details.number)) {
      socket.emit('end', players[BOT])
    }
  }

  socket.emit('message', 'To start a game, emit a `start` event with your name')

  socket.on('start', (playerName, options = {}) => {
    if (!socket.handshake.auth.token) {
      return
    }

    // Honor random number override
    const argOverride = Number(process.argv[2])
    const envOverride = Number(process.env.STARTING_NUMBER)
    const number = argOverride || envOverride || Math.round(Math.random() * 100)

    players[socket.handshake.auth.token] = playerName

    // First move; player does not choose
    socket.emit('update', {
      number,
      player: playerName
    })

    if (!options.multiplayer && !isBotPlaying(players)) {
      // Add a bot and perform a move
      const botNames = ['Einstein', 'Curie', 'Baldor', 'Hypathia', 'Euler']
      const randomIndex = Math.round(Math.random() * 10) % 4
      players[BOT] = `${botNames[randomIndex]} (bot)`
      makeBotMove(number)
    }
  })

  socket.on('move', (move) => {
    if (!move.choice) {
      return
    }

    const number = (move.number + Number.parseInt(move.choice, 10)) / 3
    const player = players[socket.handshake.auth.token]
    socket.emit('update', { ...move, number, player })

    // End game if this was the winning move
    if (isGameOver(number)) {
      socket.emit('end', player)
      return
    }

    if (isBotPlaying(players)) {
      makeBotMove(number)
    }
  })
}

module.exports = listener
