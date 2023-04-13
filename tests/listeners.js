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

      clientSocket.once('message', () => {
        t.pass('client should receive an instructions message')
        t.end()
      })
    })
  })
})

test('when P1 starts', (t) => {
  t.plan(2)

  clientSocket.emit('start', 'Luis')
  clientSocket.once('update', (details) => {
    t.equal(details.player, 'Luis', 'should specify the player making the move')
    t.equal(
      typeof details.number,
      'number',
      'client should receive a starting number'
    )
  })
})

test('when a player makes a +1 move', (t) => {
  t.plan(1)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+1',
    number: 56
  })

  clientSocket.once('update', (details) => {
    t.equal(details.number, 19, 'a corresponding result should be signaled')
  })
})

test('when a player makes a -1 move', (t) => {
  t.plan(1)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '-1',
    number: 40
  })

  clientSocket.once('update', (details) => {
    t.equal(details.number, 13, 'a corresponding result should be signaled')
  })
})

test('when a player makes a +0 move', (t) => {
  t.plan(1)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+0',
    number: 30
  })

  clientSocket.once('update', (details) => {
    t.equal(details.number, 10, 'a corresponding result should be signaled')
  })
})

test('when the number reaches 1', (t) => {
  t.plan(2)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+1',
    number: 2
  })

  clientSocket.once('update', (details) => {
    t.equal(details.number, 1, 'a corresponding result should be signaled')
  })

  clientSocket.once('end', () => {
    t.pass('an `end` event is emitted')
  })
})

test.onFinish(() => {
  io.close()
  clientSocket.close()
})
