const { createServer } = require('node:http')
const test = require('tape')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const listener = require('../listener')

const BOT = 'Bot'
let io, clientSocket

test('setup', (t) => {
  const server = createServer()
  io = new Server(server)

  server.listen(() => {
    const port = server.address().port
    clientSocket = new Client(`http://localhost:${port}`)

    io.on('connection', listener)

    clientSocket.on('connect', () => {
      t.pass('client should succesfully connect')

      clientSocket.once('message', () => {
        t.pass('client should receive an instructions message')
        t.end()
      })
    })
  })
})

test('when P1 starts a game against a bot', (t) => {
  t.plan(2)

  clientSocket.emit('start', 'Luis')
  clientSocket.on('update', (details) => {
    if (details.player === 'Luis') {
      t.equal(
        typeof details.number,
        'number',
        'client should receive a starting number'
      )
    }

    if (details.player === BOT) {
      t.pass('client should see a bot move')
      clientSocket.removeAllListeners()
    }
  })
})

test('when a player makes a +1 move', (t) => {
  t.plan(3)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+1',
    number: 56
  })

  clientSocket.once('update', (details) => {
    t.equal(details.number, 19, 'a corresponding result should be signaled')
    t.equal(details.player, 'Luis', "player's name is included in the signal")
    t.equal(details.choice, '+1', "player's choice is included in the signal")
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

test('when playing against a bot', (t) => {
  t.plan(2)

  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+1',
    number: 56
  })

  clientSocket.on('update', (details) => {
    if (details.player === BOT) {
      // Human plays 57, so bot plays starting on 19 and chooses 18
      t.equal(details.number, 6, 'a corresponding result should be signaled')
      t.equal(details.choice, '-1', "the bot's choice should be included in the signal")
      clientSocket.removeAllListeners()
    }
  })
})

test('when bot makes a final move', (t) => {
  clientSocket.emit('move', {
    player: 'Luis',
    choice: '-1',
    number: 7
  })

  clientSocket.once('end', t.end, 'the end of the game should be signaled')
})

test('when making a final move', (t) => {
  clientSocket.emit('move', {
    player: 'Luis',
    choice: '+1',
    number: 2
  })

  clientSocket.once('end', t.end, 'the end of the game should be signaled')
})

test.onFinish(() => {
  io.close()
  clientSocket.close()
})
