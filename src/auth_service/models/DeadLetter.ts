import { DataTypes } from "sequelize"

import { BaseDeadLetter as DeadLetter } from "@common/models/BaseDeadLetter"
import { db } from "@auth/services"

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
  tableName: "auth_Dead_letters",
})

export { DeadLetter }
