import { DataTypes, Model } from "sequelize"

import { USER_ROLES } from "@common/constants"
import { db } from "@auth/services"

class User extends Model {
  declare publicId: string
  declare role: string
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
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: USER_ROLES.user,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  salt: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize: db,
  tableName: "auth_Users",
})

export { User }
