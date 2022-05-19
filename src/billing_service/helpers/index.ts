const getUnixTimestamp = (date?: Date) => {
  const inMs = date?.getTime() ?? Date.now()
  return Math.floor(inMs / 1000)
}

export { getUnixTimestamp }
