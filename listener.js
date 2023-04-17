function makeListener (io) {
  const BOT = 'bot'
  let players = {}
  let number

  function isBotPlaying () {
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

  function finishGame (winner) {
    // No game was ongoing
    if (!Object.keys(players).length) {
      return
    }

    io.emit('end', winner)
    players = {}
  }

  function listener (socket) {
    const token = socket.handshake.auth.token

    function makeBotMove () {
      const botChoice = makeBotChoice()

      number = (number + Number.parseInt(botChoice, 10)) / 3

      const bot = players[BOT]
      io.emit('update', {
        choice: botChoice,
        player: bot,
        number
      })

      if (isGameOver()) {
        finishGame(bot)
      }
    }

    function handleLeave () {
      if (players[token]) {
        io.emit('message', `${players[token]} left the game.`)
      }

      if (isBotPlaying()) {
        io.emit('message', `${players[BOT]} left the game.`)
      }

      finishGame()
    }

    socket.emit('message', "To start a game, emit a `start` event with your name, e.g. socket.emit('start', 'Luis')")

    socket.on('start', (playerName, options = {}) => {
      if (!token) {
        socket.emit('message', 'Game start failed. Did you send an auth token?')
        return
      }

      if (Object.keys(players).length > 1) {
        socket.emit('message', 'Another game is already in progress. Please wait for it to finish.')
        return
      }

      players[token] = playerName

      if (options.multiplayer && Object.keys(players).length < 2) {
        io.emit('message', `${playerName} is ready to play. Waiting for another player...`)
        return
      }

      // Honor random number override
      const argOverride = Number(process.argv[2])
      const envOverride = Number(process.env.STARTING_NUMBER)

      // Add 2 to random generated number to avoid starting with 0 or 1
      number = argOverride || envOverride || Math.round(Math.random() * 100) + 2

      // Starts the game when the second player joins
      if (options.multiplayer) {
        // Find the player 1
        const p1Key = Object.keys(players).find((key) => key !== token)
        io.emit('update', {
          number,
          player: players[p1Key]
        })

        return
      }

      // Human vs bot; make both moves.
      io.emit('update', {
        number,
        player: playerName
      })

      const botNames = ['Arya', 'Snow', 'Sansa', 'Tyrion', 'Daenerys', 'Robb']
      const randomIndex = Math.round(Math.random() * 10) % 4
      players[BOT] = `${botNames[randomIndex]} (bot)`
      makeBotMove()
    })

    socket.on('move', (choice) => {
      if (!players[token]) {
        // Player is not in game
        return
      }

      const sum = number + Number.parseInt(choice, 10)
      if (!choice || !(sum % 3 === 0)) {
        const error = new Error()
        error.name = 'InvalidInput'
        error.message = `${sum} is not divisible by 3. Please try again.`
        socket.emit('error', error)
        return
      }

      number = (number + Number.parseInt(choice, 10)) / 3
      const player = players[token]
      io.emit('update', { player, choice, number })

      // End game if this was the winning move
      if (isGameOver()) {
        finishGame(player)
        return
      }

      if (isBotPlaying()) {
        makeBotMove()
      }
    })

    socket.on('leave', handleLeave)

    socket.on('disconnect', handleLeave)
  }

  return listener
}

module.exports = makeListener
