import { DataTypes, Model, ModelStatic } from "sequelize"

import { SERVICES } from "@common/constants"
import { db } from "@billing/services"
import { getTableName } from "@common/helperts"

class Balance extends Model {
  declare id: number
  declare publicId: string
  declare userId: string
  declare amount: string

  static associate(models: Record<string, ModelStatic<Model>>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.belongsTo(models["User"]!, {
      foreignKey: "userId",
      as: "user",
    })
  }
}

Balance.init({
  id: {
    type: DataTypes.INTEGER,
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
  amount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      isInt: true,
    },
  },
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.billing, Balance.name),
})

export { Balance }
