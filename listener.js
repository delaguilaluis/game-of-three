function makeListener (io) {
  const BOT = 'bot'
  let players = {}
  let number
  let nextPlayerKey

  function getStartingNumber () {
    // Get starting number; honor random number override
    const argOverride = Number(process.argv[2])
    const envOverride = Number(process.env.STARTING_NUMBER)

    // Add 2 to random generated number to avoid starting with 0 or 1
    return argOverride || envOverride || Math.round(Math.random() * 100) + 2
  }

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
    io.emit('end', winner)
    players = {}
    nextPlayerKey = null
  }

  function listener (socket) {
    const token = socket.handshake.auth.token

    function setNextTurn (token) {
      io.emit('message', `Waiting for a move by ${players[token]}...`)
      nextPlayerKey = token
    }

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
      } else {
        setNextTurn(token)
      }
    }

    function handleLeave () {
      // The player is not in a game
      if (!players[token]) {
        return
      }

      io.emit('message', `${players[token]} left the game.`)

      if (isBotPlaying()) {
        io.emit('message', `${players[BOT]} left the game.`)
      }

      finishGame()
    }

    /**
     * Signals whether starting a game is valid.
     * As a side-effect, it emits the reason to the `message` channel
     * @param {object} options
     * @returns boolean
     */
    function validateStart (options) {
      if (!token) {
        socket.emit('message', 'Game start failed. Did you send an auth token?')
        return false
      }

      if (Object.keys(players).length > 1) {
        socket.emit(
          'message',
          'Another game is in progress. Please wait for it to finish.'
        )

        return false
      }

      if (Object.keys(players).length === 1 && !options.multiplayer) {
        const player = Object.values(players)[0]
        socket.emit(
          'message',
          `${player} is waiting in queue for a multiplayer game.`
        )

        return false
      }

      const { playerName } = options
      if (Object.values(players).includes(playerName)) {
        socket.emit('message', `There's already a player named ${playerName}.`)
        return false
      }

      return true
    }

    socket.emit('message', "To start a game, emit a `start` event with your name, e.g. socket.emit('start', 'Luis')")

    socket.on('start', (playerName, options = {}) => {
      if (!validateStart({ ...options, playerName })) {
        return
      }

      players[token] = playerName

      if (options.multiplayer && Object.keys(players).length < 2) {
        io.emit(
          'message',
          `${playerName} is ready to play. Waiting for another player...`
        )

        return
      }

      io.emit('message', 'Game started!')
      number = getStartingNumber()

      // Human vs human; make first move.
      if (options.multiplayer) {
        // Find the player 1
        const p1Key = Object.keys(players).find((key) => key !== token)
        io.emit('update', {
          number,
          player: players[p1Key]
        })

        setNextTurn(token)
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

      setNextTurn(BOT)
      makeBotMove()
    })

    socket.on('move', (choice) => {
      if (nextPlayerKey !== token) {
        // Not the player's turn
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
        return
      }

      // Multiplayer scenario; Find the player 2 and assign the next turn.
      const p2Key = Object.keys(players).find((key) => key !== token)
      setNextTurn(p2Key)
    })

    socket.on('leave', handleLeave)

    socket.on('disconnect', handleLeave)
  }

  return listener
}

module.exports = makeListener
