import { Model, ModelStatic } from "sequelize"

import {
  ENUM_IN_MODEL,
  INT,
  INT_PK,
  INT_POSITIVE,
  UUIDV4,
  UUIDV4_DEFAULT_UNIQUE,
} from "@common/models/fields"
import { SERVICES, TRANSACTION_STATUSES } from "@common/constants"
import { db } from "@billing/services"
import { getTableName } from "@common/helperts"

class Transaction extends Model {
  declare id: number
  declare publicId: string
  declare userId: string
  declare taskId: string
  declare difference: number
  declare status: TRANSACTION_STATUSES
  declare recordedAt: number

  static associate(models: Record<string, ModelStatic<Model>>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.belongsTo(models["User"]!, {
      foreignKey: "userId",
      as: "user",
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.belongsTo(models["Task"]!, {
      foreignKey: "taskId",
      as: "task",
    })
  }
}

Transaction.init({
  id: INT_PK,
  publicId: UUIDV4_DEFAULT_UNIQUE,
  userId: {
    ...UUIDV4,
    allowNull: true,
    references: {
      model: {
        tableName: "billing_Users",
      },
      key: "publicId",
    },
  },
  taskId: {
    ...UUIDV4,
    allowNull: true,
    references: {
      model: {
        tableName: "billing_Tasks",
      },
      key: "publicId",
    },
  },
  difference: INT,
  status: ENUM_IN_MODEL(TRANSACTION_STATUSES),
  recordedAt: INT_POSITIVE,
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.billing, Transaction.name),
})

export { Transaction }
