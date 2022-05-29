import { DataTypes } from "sequelize"

import {
  EMAIL_UNIQUE,
  ENUM_IN_MODEL,
  INT_PK,
  UUIDV4_DEFAULT_UNIQUE,
} from "@common/models/fields"
import { SERVICES, USER_ROLES } from "@common/constants"
import { BaseUser } from "@common/models/BaseUser"
import { db } from "@auth/services"
import { getTableName } from "@common/helperts"

class User extends BaseUser {
  declare passwordHash: string
  declare salt: string
}

User.init({
  id: INT_PK,
  publicId: UUIDV4_DEFAULT_UNIQUE,
  role: ENUM_IN_MODEL(USER_ROLES, USER_ROLES.user),
  email: EMAIL_UNIQUE,
  passwordHash: {
    type: DataTypes.STRING,
  },
  salt: {
    type: DataTypes.STRING,
  },
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.auth, User.name),
})

export { User }
