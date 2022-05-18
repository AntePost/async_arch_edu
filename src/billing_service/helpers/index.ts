const getRandomIntInclusive = (min: number, max: number) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const getUnixTimestamp = (date?: Date) => {
  const inMs = date?.getTime() ?? Date.now()
  return Math.floor(inMs / 1000)
}

export { getRandomIntInclusive, getUnixTimestamp }
