# Game of Three

A code challenge implementation

## Run it


### Simulation

```bash
node simulation.js
```

You can override the number in the first turn by sending it as a parameter

```bash
node simulation.js 56
```

### Thoughts

* The game doesn't need human inputs, nor to be distributed. I'll start by
  simulating a run locally (`simulation.js`).

* The game doesn't require persistance, thus modelling it with API resources
  doesn't make sense now. I'll give WebSockets a try.

### Assumptions

* The random number generated in the first turn should be between 0 and 100.
