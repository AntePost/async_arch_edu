import { DataTypes, Model } from "sequelize"

import { USER_ROLES } from "@common/constants"
import { db } from "@auth/services"
import { getEnumValues } from "@common/helperts"

class User extends Model {
  declare publicId: string
  declare role: USER_ROLES
  declare email: string
  declare passwordHash: string
  declare salt: string
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
    defaultValue: USER_ROLES.user,
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
  passwordHash: {
    type: DataTypes.STRING,
  },
  salt: {
    type: DataTypes.STRING,
  },
}, {
  sequelize: db,
  tableName: "auth_Users",
})

export { User }
