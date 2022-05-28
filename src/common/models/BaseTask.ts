import { Model } from "sequelize"

import type { TASK_STATUSES } from "@common/constants"

class BaseTask extends Model {
  declare id: number
  declare publicId: string
  declare assignedTo: string
  declare title: string
  declare jiraId: string
  declare status: TASK_STATUSES
}

export { BaseTask }
