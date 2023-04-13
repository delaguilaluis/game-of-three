const { createServer } = require('node:http')
const test = require('tape')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const listener = require('../listener')

let io, serverSocket, clientSocket

test('setup', (t) => {
  const server = createServer()
  io = new Server(server)

  server.listen(() => {
    const port = server.address().port
    clientSocket = new Client(`http://localhost:${port}`)

    io.on('connection', (socket) => {
      listener(socket)
      serverSocket = socket
    })

    clientSocket.on('connect', () => {
      t.pass('client should succesfully connect')

      clientSocket.on('message', () => {
        t.pass('client should receive an instructions message')
        t.end()
      })
    })
  })
})

test('when P1 starts', (t) => {
  t.plan(2)

  clientSocket.emit('start', 'Luis')
  clientSocket.on('move', (move) => {
    t.equal(move.player, 'Luis', 'should specify the player making the move')
    t.equal(
      typeof move.number,
      'number',
      'client should receive a random number'
    )
  })
})

test.onFinish(() => {
  io.close()
  clientSocket.close()
})