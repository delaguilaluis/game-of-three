const http = require('node:http')
const express = require('express')
const { Server } = require('socket.io')
const listener = require('./listener')

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.get('/', express.static('./public'))

io.on('connection', listener)

const port = 8080
server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
