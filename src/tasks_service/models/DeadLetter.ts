import { DataTypes } from "sequelize"

import { BaseDeadLetter as DeadLetter } from "@common/models/BaseDeadLetter"
import { SERVICES } from "@common/constants"
import { db } from "@tasks/services"
import { getTableName } from "@common/helperts"

DeadLetter.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  exchange: {
    type: DataTypes.STRING,
  },
  routingKey: {
    type: DataTypes.STRING,
  },
  data: {
    type: DataTypes.TEXT,
  },
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.tasks, DeadLetter.name),
})

export { DeadLetter }
