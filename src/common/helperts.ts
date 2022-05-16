import type { EVENT_NAMES } from "./constants"
import type { Event } from "./contracts"

type EnumObject = {[key: string]: number | string};
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

export { getEnumValues, isCertainEvent }
