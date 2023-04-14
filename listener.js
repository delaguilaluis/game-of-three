function makeListener (io) {
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

  function finishGame (player) {
    io.emit('end', player || players[BOT])
    players = {}
  }

  function listener (socket) {
    const token = socket.handshake.auth.token

    function makeBotMove () {
      const botChoice = makeBotChoice()

      number = (number + Number.parseInt(botChoice, 10)) / 3

      const player = players[BOT]
      io.emit('update', {
        choice: botChoice,
        player,
        number
      })

      if (isGameOver()) {
        finishGame(player)
      }
    }

    socket.emit('message', "To start a game, emit a `start` event with your name, e.g. socket.emit('start', 'Luis')")

    socket.on('start', (playerName, options = {}) => {
      if (!token) {
        socket.emit('message', 'Game start failed. Did you send an auth token?')
        return
      }

      players[token] = playerName
      const playerKeys = Object.keys(players)

      if (options.multiplayer && playerKeys.length < 2) {
        socket.emit('message', 'Waiting for another player to join...')
        return
      }

      // Honor random number override
      const argOverride = Number(process.argv[2])
      const envOverride = Number(process.env.STARTING_NUMBER)
      number = argOverride || envOverride || Math.round(Math.random() * 100)

      // Starts the game when the second player joins
      if (options.multiplayer) {
        // Find the player 1
        const p1Key = playerKeys.find((key) => key !== token)
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

      const botNames = ['Einstein', 'Curie', 'Baldor', 'Hypathia', 'Euler']
      const randomIndex = Math.round(Math.random() * 10) % 4
      players[BOT] = `${botNames[randomIndex]} (bot)`
      makeBotMove()
    })

    socket.on('move', (choice) => {
      if (!choice) {
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

      if (isBotPlaying(players)) {
        makeBotMove()
      }
    })

    socket.on('leave', () => {
      delete players[token]
    })

    socket.on('disconnect', () => {
      delete players[token]
    })
  }

  return listener
}

module.exports = makeListener
