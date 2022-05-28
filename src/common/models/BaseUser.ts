import { Model } from "sequelize"

import type { USER_ROLES } from "@common/constants"

class BaseUser extends Model {
  declare publicId: string
  declare role: USER_ROLES
  declare email: string
}

export { BaseUser }
