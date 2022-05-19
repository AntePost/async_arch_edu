import { DataTypes, Model } from "sequelize"

import { db } from "@billing/services"

class DeadLetter extends Model {
  declare id: number
  declare exchange: string
  declare routing_key: string
  declare data: string
}

DeadLetter.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  exchange: {
    type: DataTypes.STRING,
  },
  routing_key: {
    type: DataTypes.STRING,
  },
  data: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize: db,
  tableName: "billing_Dead_letters",
})

export { DeadLetter }
