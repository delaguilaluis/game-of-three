const http = require('node:http')
const express = require('express')
const { Server } = require('socket.io')
const listeners = require('./listeners.js')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.get('/', express.static('./public'))

io.on('connection', listeners.connection)

const port = 3000
server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
