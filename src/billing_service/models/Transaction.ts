import { DataTypes, Model, ModelStatic } from "sequelize"

import { TRANSACTION_STATUSES } from "@common/constants"
import { db } from "@billing/services"
import { getEnumValues } from "@common/helperts"

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
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  publicId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    validate: {
      isUUID: 4,
    },
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: {
        tableName: "billing_Users",
      },
      key: "publicId",
    },
    validate: {
      isUUID: 4,
    },
  },
  taskId: {
    type: DataTypes.UUID,
    references: {
      model: {
        tableName: "billing_Tasks",
      },
      key: "publicId",
    },
    validate: {
      isUUID: 4,
    },
  },
  difference: {
    type: DataTypes.INTEGER,
    validate: {
      isInt: true,
    },
  },
  status: {
    type: DataTypes.STRING,
    validate: {
      isIn: [getEnumValues(TRANSACTION_STATUSES)],
    },
  },
  recordedAt: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    validate: {
      isInt: true,
      min: 0,
    },
  },
}, {
  sequelize: db,
  tableName: "billing_Transactions",
})

export { Transaction }
