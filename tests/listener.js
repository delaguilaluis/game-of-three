const { createServer } = require('node:http')
const test = require('tape')
const { Server } = require('socket.io')
const Client = require('socket.io-client')
const listener = require('../listener')

let io, clientSocket

test('setup', (t) => {
  const server = createServer()
  io = new Server(server)

  server.listen(() => {
    const port = server.address().port
    clientSocket = new Client(`http://localhost:${port}`, {
      auth: {
        token: 'test'
      }
    })

    io.on('connection', listener(io))

    clientSocket.on('connect', () => {
      t.pass('client should succesfully connect')

      clientSocket.once('message', () => {
        t.pass('client should receive an instructions message')
        t.end()
      })
    })
  })
})

test('when a multiplayer game starts', (t) => {
  t.plan(1)

  clientSocket.emit('start', 'Luis', { multiplayer: true })
  clientSocket.on('update', (details) => {
    if (details.player !== 'Luis') {
      t.fail('no bot should be playing')
    }
  })

  setTimeout(() => {
    t.pass('no bot move should happen')

    clientSocket.removeAllListeners('update')
    clientSocket.emit('leave')
  }, 100)
})

test('when a single player game starts', (t) => {
  t.plan(2)
  process.env.STARTING_NUMBER = 777

  clientSocket.emit('start', 'Luis')
  clientSocket.on('update', (details) => {
    if (details.player === 'Luis') {
      t.equal(
        details.number,
        777,
        'the initial move should be signaled'
      )
    } else {
      t.pass('client should see a bot move')

      clientSocket.removeAllListeners('update')
      delete process.env.STARTING_NUMBER
    }
  })
})

test('when a player makes an invalid move', (t) => {
  t.plan(1)

  // Bot play results in 259
  clientSocket.emit('move', '+1')

  clientSocket.once('error', (err) => {
    t.equal(err.name, 'InvalidInput', 'an erorr is signaled')
  })
})

test('when a player makes a -1 move', (t) => {
  t.plan(3)

  // Bot play results in 259, so we should move -1
  clientSocket.emit('move', '-1')

  clientSocket.once('update', (details) => {
    t.equal(details.number, 86, 'a corresponding result should be signaled')
    t.equal(details.player, 'Luis', "player's name is included in the signal")
    t.equal(details.choice, '-1', "player's choice is included in the signal")
  })
})

test('when a player makes a +1 move', (t) => {
  t.plan(1)

  // Bot play results in 29, so we should move +1
  clientSocket.emit('move', '+1')

  clientSocket.once('update', (details) => {
    t.equal(details.number, 10, 'a corresponding result should be signaled')
  })
})

test('when a player makes a +0 move', (t) => {
  t.plan(1)

  // Bot play results in 3, so we should move +0
  clientSocket.emit('move', '+0')

  clientSocket.once('update', (details) => {
    t.equal(details.number, 1, 'a corresponding result should be signaled')
  })
})

test('when a human makes a final move', (t) => {
  t.plan(1)
  process.env.STARTING_NUMBER = 11

  clientSocket.emit('start', 'Luis')
  clientSocket.on('update', (details) => {
    // After bot move, the resulting number should be 4
    if (details.player !== 'Luis') {
      clientSocket.emit('move', '-1')
      clientSocket.once('end', (winner) => {
        t.equal(winner, 'Luis', 'they should be announced as winner')
      })

      clientSocket.removeAllListeners('update')
      delete process.env.STARTING_NUMBER
    }
  })
})

test('when a bot makes a final move', (t) => {
  t.plan(1)
  process.env.STARTING_NUMBER = 2

  clientSocket.emit('start', 'Luis')
  clientSocket.once('end', (winner) => {
    t.notEqual(winner, 'Luis', 'it should be announced as winner')

    delete process.env.STARTING_NUMBER
  })
})

test('when a single player game starts and the player leaves', (t) => {
  t.plan(4)

  clientSocket.emit('start', 'Luis')
  clientSocket.once('update', ({ number }) => {
    t.equal(typeof number, 'number', 'an initial random number should be sent')

    clientSocket.emit('leave')
  })

  clientSocket.on('message', (msg) => {
    t.ok(msg.includes('left'), 'Player (and bot) leaving the game is announced')
  })

  clientSocket.once('end', (winner) => {
    t.notOk(winner, 'the game end is signaled without a winner')

    clientSocket.removeAllListeners('message')
  })
})

test.onFinish(() => {
  io.close()
  clientSocket.close()
})
