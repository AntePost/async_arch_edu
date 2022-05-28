import { DataTypes, Model, ModelStatic } from "sequelize"

import { BaseUser } from "@common/models/BaseUser"
import { USER_ROLES } from "@common/constants"
import { db } from "@tasks/services"
import { getEnumValues } from "@common/helperts"

class User extends BaseUser {
  static associate(models: Record<string, ModelStatic<Model>>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.hasMany(models["Task"]!, {
      foreignKey: "assignedTo",
      as: "tasks",
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
  tableName: "tasks_Users",
})

export { User }
