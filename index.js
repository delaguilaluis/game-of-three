function main (previous) {
  if (previous) {
    console.log(previous)
    console.log('/3')
  }

  // Generate a random number on the first call
  const number = previous ? previous / 3 : Math.round(Math.random() * 100)
  console.log(number)

  // Exit condition
  if (number === 1) {
    console.log('WIN!!!')
    return
  }

  if (number % 3 === 0) {
    console.log('+0')
    return main(number)
  }

  if ((number + 1) % 3 === 0) {
    console.log('+1')
    return main(number + 1)
  }

  console.log('-1')
  return main(number - 1)
}

main()
