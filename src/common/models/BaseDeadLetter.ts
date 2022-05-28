import { Model } from "sequelize"

class BaseDeadLetter extends Model {
  declare id: number
  declare exchange: string
  declare routing_key: string
  declare data: string
}

export { BaseDeadLetter }
