import { DataTypes } from "sequelize"

import { BaseDeadLetter as DeadLetter } from "@common/models/BaseDeadLetter"
import { INT_PK } from "@common/models/fields"
import { SERVICES } from "@common/constants"
import { db } from "@tasks/services"
import { getTableName } from "@common/helperts"

DeadLetter.init({
  id: INT_PK,
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
