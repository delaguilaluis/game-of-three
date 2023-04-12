function connection (socket) {
  console.log('a user connected')
  socket.emit('message', 'To start a game, emit a `play` event with your name')
}

module.exports = { connection }
