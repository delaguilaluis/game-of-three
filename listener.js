module.exports = function listener (socket) {
  console.log('a user connected')
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
  })

  socket.on('move', (move) => {
    let addedValue
    if (move.choice) {
      switch (move.choice) {
        case '+1':
          addedValue = 1
          break
        case '-1':
          addedValue = -1
          break
        default:
          addedValue = 0
          break
      }

      socket.emit('update', {
        number: move.number + addedValue
      })
    }
  })
}
