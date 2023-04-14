const BOT = 'bot'
let players = {}
let number

function isBotPlaying (players) {
  return Boolean(players[BOT])
}

function makeBotChoice () {
  if (number % 3 === 0) {
    return '+0'
  }

  if ((number + 1) % 3 === 0) {
    return '+1'
  }

  // Only one remaining scenario: decrease by one
  return '-1'
}

function isGameOver () {
  return number === 1
}

function finishGame (socket, player) {
  socket.emit('end', player || players[BOT])
  players = {}
}

function listener (socket) {
  function makeBotMove () {
    const botChoice = makeBotChoice()

    number = (number + Number.parseInt(botChoice, 10)) / 3

    socket.emit('update', {
      player: players[BOT],
      choice: botChoice,
      number
    })

    if (isGameOver()) {
      finishGame(socket)
    }
  }

  socket.emit('message', "To start a game, emit a `start` event with your name, e.g. socket.emit('start', 'Luis')")

  socket.on('start', (playerName, options = {}) => {
    if (!socket.handshake.auth.token) {
      return
    }

    // Honor random number override
    const argOverride = Number(process.argv[2])
    const envOverride = Number(process.env.STARTING_NUMBER)
    number = argOverride || envOverride || Math.round(Math.random() * 100)

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
      makeBotMove()
    }
  })

  socket.on('move', (choice) => {
    if (!choice) {
      return
    }

    number = (number + Number.parseInt(choice, 10)) / 3
    const player = players[socket.handshake.auth.token]
    socket.emit('update', { player, choice, number })

    // End game if this was the winning move
    if (isGameOver()) {
      finishGame(socket, player)
      return
    }

    if (isBotPlaying(players)) {
      makeBotMove()
    }
  })
}

module.exports = listener
