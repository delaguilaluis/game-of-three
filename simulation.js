function getInitialNumber () {
  // Honor random number override sent as parameter
  return Number(process.argv[2]) || Math.round(Math.random() * 100)
}

function main (player = 'P1', previousNum) {
  const number = previousNum === undefined ? getInitialNumber() : previousNum
  const nextPlayer = player === 'P2' ? 'P1' : 'P2'

  // Exit condition; skip current player
  if (number === 1) {
    console.log(`${nextPlayer} WINS!!!`)
    return
  }

  console.log(`-> ${player} turn <-`)

  // First turn; number doesn't change
  if (!previousNum) {
    console.log(number)
    return main(nextPlayer, number)
  }

  if (number % 3 === 0) {
    console.log('+0')
    console.log(number)

    console.log('/3')
    const nextNumber = number / 3
    console.log(nextNumber)

    return main(nextPlayer, nextNumber)
  }

  if ((number + 1) % 3 === 0) {
    console.log('+1')
    console.log(number + 1)

    console.log('/3')
    const nextNumber = (number + 1) / 3
    console.log(nextNumber)

    return main(nextPlayer, nextNumber)
  }

  // Only one remaining scenario: decrease by one
  console.log('-1')
  console.log(number - 1)

  console.log('/3')
  const nextNumber = (number - 1) / 3
  console.log(nextNumber)

  return main(nextPlayer, nextNumber)
}

main()
