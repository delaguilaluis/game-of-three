const { createServer } = require('node:http')
const test = require('tape')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const listeners = require('../listeners')

let io, serverSocket, clientSocket

test('setup', (t) => {
  t.plan(2)

  const server = createServer()
  io = new Server(server)
  server.listen(() => {
    const port = server.address().port
    clientSocket = new Client(`http://localhost:${port}`)
    io.on('connection', (socket) => {
      listeners.connection(socket)
      serverSocket = socket
    })

    io.on('play', listeners.play)

    clientSocket.on('connect', () => {
      t.pass('should succesfully connect')
    })

    clientSocket.on('message', () => {
      t.pass('should receive an instructions message')
    })
  })
})

test('Should return the initial (random) number when P1 starts', (t) => {
  clientSocket.emit('play', 'Luis')
})

test.onFinish(() => {
  io.close()
  clientSocket.close()
})
