# Game of Three

A code challenge implementation

## Run it

```bash
npm start
```

The random number assigned in the first move can be overridden by sending it as
a parameter:

```bash
npm start 56
```

If no argument is present, the `STARTING_NUMBER` environment variable will be
considered.

## Play it

Visit http://localhost:8080 and follow the on-screen instructions.

## API

A client can be developed by consuming the Game of Threes API.

The server will listen to [Socket.io](https://socket.io) connections in the
port 8080. Here is a guide to perform a
[client installation](https://socket.io/docs/v4/client-installation/).

### Connection

Authentication is required by sending an auth token. 
If a token is already in use, players would not be considered for playing.

In this example, a string based on the current time is used as token:

```javascript
const options = {
  auth: {
    token: Date.now().toString(36)
  }
}

const socket = io('ws://localhost:8080', options);
```

### Events listened

#### Event: `start`

* `name`: string with the name of the player requesting a new game.
* `options`: optional object with the following keys:
  * `multiplayer`: boolean indicating whether the game should wait for another
  human interaction. Default: `false`.

```javascript
socket.emit('start', 'Luis', { multiplayer: true })
```

#### Event: `move`

* `choice`: string with the value to add to the current number. One of `-1`,
  `+1` or `+0`.

```javascript
socket.emit('move', '-1')
```

### Events fired

#### Event: `update`

* `details`: an Object that includes details about the game state:
  * `player`: string with the name of the player that made the move.
  * `choice`: string with the player's choice (one of `-1`, `+1` or `+0`).
  * `number`: number with the resulting value after applying the choice to the
    previous number and dividing it by 3.

Broadcasted upon players moves.

```javascript
socket.on('update', (details) => {
  console.log(details)
  // {
  //   "player": "Luis",
  //   "choice": "-1",
  //   "number": 18
  // }
})
```

#### Event: `error`

* `error`: an Error object
  * `name`: string with the name of the error to help identify the scenario.
  * `message`: string with a human-readable description of the error.

Could be fired upon an invalid player move.

```javascript
socket.on('error', (error) => {
  console.log(error.name)
  // InvalidInput
})
```

#### Event: `message`

* `message`: string with an announcement

```javascript
socket.on('message', (message) => {
  console.log(message)
  // To start a game, emit a `start` event with your name
})
```

Fired when the server makes an announcement.

#### Event: `end`

* `winner`: string with the name of the player who won

```javascript
socket.on('end', (winner) => {
  console.log(winner)
  // Deep Blue (bot)
})
```

Broadcasted when the game ends.

## Thoughts

* The game doesn't need human inputs, nor to be distributed. I'll start by
  simulating a run locally (`simulation.js`).

* The game doesn't require persistance, thus modelling it with API resources
  doesn't make sense now. I'll give WebSockets a try.

* What happens if a request to start a game occurs mid game? I'll build a
  working version without validation any of these scenarios for starters.

## Assumptions

* The random number generated in the first turn should be between 0 and 100.

## Nice to have

* Game of Thrones theme :sunglasses:

### Next steps

* Allow to finish a human vs human game
