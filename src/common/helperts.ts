import type { EVENT_NAMES, SERVICES } from "./constants"
import type { EnumObject } from "./interfaces"
import type { Event } from "./contracts"

type EnumObjectEnum<E extends EnumObject> = E extends {
    [key: string]: infer ET | string
  } ? ET : never;

const getEnumValues = <E extends EnumObject>(enumObject: E)
  : EnumObjectEnum<E>[] => {
  return Object.keys(enumObject)
    .filter(key => Number.isNaN(Number(key)))
    .map(key => enumObject[key] as EnumObjectEnum<E>)
}

const isCertainEvent = <E extends Event>(event: Event, name: EVENT_NAMES)
  : event is E => {
  return event.meta.name === name
}

const getRandomInt = (
  min: number,
  max: number,
  upperInclusive = false,
) => {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + +upperInclusive) + min)
}

const logEventHandlingError = (
  err: Error,
  event: Event,
  eventName: EVENT_NAMES,
) => {
  console.log(`Error when handling ${eventName}.\n--- Data:\n`,
    event,
    "--- Error:\n",
    err)
}

const replacer = / {2,}|\t+/g
const squashWhitespace = (
  str: string | TemplateStringsArray,
  ...values: unknown[]
) => {
  if (typeof str === "string") {
    return str.replaceAll(replacer, " ")
  }

  return Array.from(str)
    .map(el => el.replaceAll(replacer, " "))
    .map(((el, i) => {
      if (i === 0) {
        return el
      }

      return values[i - 1] + el
    }))
    .join("")
}

const getTableName = (service: SERVICES, table: string) => {
  return `${service}_${table}s`
}

const mixKey = (key?: unknown) => {
  if (key != null) {
    return { key }
  }

  return {}
}

export {
  getEnumValues,
  isCertainEvent,
  getRandomInt,
  logEventHandlingError,
  squashWhitespace,
  getTableName,
  mixKey,
}
