const getUnixTimestamp = (date?: Date) => {
  const inMs = date?.getTime() ?? Date.now()
  return Math.floor(inMs / 1000)
}

const DAY_IN_SEC = 86400

interface Params {
  year?: number,
  month?: number,
  day?: number,
  dayOffset?: number,
  numOfDays? : number,
}

const getBillingCycleRange = ({ year, month, day, dayOffset = 0, numOfDays = 1 }
  : Params = {}) => {
  const now = new Date()

  let start = getUnixTimestamp(new Date(
    year ?? now.getUTCFullYear(),
    month ? month - 1 : now.getUTCMonth(),
    day ?? now.getUTCDate(),
    0,
    -now.getTimezoneOffset(),
  ))

  start = start + (dayOffset * DAY_IN_SEC)

  const end = start + (DAY_IN_SEC * numOfDays) - 1

  return { start, end }
}

export { getUnixTimestamp, getBillingCycleRange }
