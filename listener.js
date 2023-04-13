module.exports = function listener (socket) {
  console.log('a user connected')
  socket.emit('message', 'To start a game, emit a `start` event with your name')

  socket.on('start', (player) => {
    // Honor random number override sent as parameter
    const number = Number(process.argv[2]) || Math.round(Math.random() * 100)
    socket.emit('move', {
      player,
      number
    })
  })
}
