import { DataTypes, Model, ModelStatic } from "sequelize"

import { SERVICES, USER_ROLES } from "@common/constants"
import { getEnumValues, getTableName } from "@common/helperts"
import { BaseUser } from "@common/models/BaseUser"
import { db } from "@billing/services"

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
      as: "Balance",
    })
  }
}

User.init({
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
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
    validate: {
      isIn: [getEnumValues(USER_ROLES)],
    },
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.billing, User.name),
})

export { User }
