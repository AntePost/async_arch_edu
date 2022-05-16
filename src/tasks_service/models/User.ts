import { DataTypes, Model, ModelStatic } from "sequelize"

import { USER_ROLES } from "@common/constants"
import { db } from "@tasks/services"
import { getEnumValues } from "@common/helperts"

class User extends Model {
  declare id: number
  declare publicId: string
  declare email: string
  declare role: USER_ROLES

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
    allowNull: false,
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