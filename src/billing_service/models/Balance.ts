import { Model, ModelStatic } from "sequelize"

import {
  INT_DEFAULT,
  INT_PK,
  UUIDV4,
  UUIDV4_DEFAULT_UNIQUE,
} from "@common/models/fields"
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
  id: INT_PK,
  publicId: UUIDV4_DEFAULT_UNIQUE,
  userId: {
    ...UUIDV4,
    references: {
      model: {
        tableName: "billing_Users",
      },
      key: "publicId",
    },
  },
  amount: INT_DEFAULT(0),
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.billing, Balance.name),
})

export { Balance }
