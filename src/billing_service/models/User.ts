import type { Model, ModelStatic } from "sequelize"

import {
  EMAIL_UNIQUE,
  ENUM_IN_MODEL,
  INT_PK,
  UUIDV4_DEFAULT_UNIQUE,
} from "@common/models/fields"
import { SERVICES, USER_ROLES } from "@common/constants"
import { BaseUser } from "@common/models/BaseUser"
import { db } from "@billing/services"
import { getTableName } from "@common/helperts"

class User extends BaseUser {
  static associate(models: Record<string, ModelStatic<Model>>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.hasMany(models["Task"]!, {
      foreignKey: "assignedTo",
      as: "tasks",
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.hasMany(models["Transaction"]!, {
      foreignKey: "userId",
      as: "transactions",
    })
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.hasOne(models["Balance"]!, {
      foreignKey: "userId",
      as: "balance",
    })
  }
}

User.init({
  id: INT_PK,
  publicId: UUIDV4_DEFAULT_UNIQUE,
  role: ENUM_IN_MODEL(USER_ROLES, USER_ROLES.user),
  email: EMAIL_UNIQUE,
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.billing, User.name),
})

export { User }
