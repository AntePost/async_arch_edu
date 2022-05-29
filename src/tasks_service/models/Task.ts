import { DataTypes, Model, ModelStatic } from "sequelize"

import {
  ENUM_IN_MODEL,
  INT_PK,
  UUIDV4,
  UUIDV4_DEFAULT_UNIQUE,
} from "@common/models/fields"
import { SERVICES, TASK_STATUSES } from "@common/constants"
import { BaseTask } from "@common/models/BaseTask"
import { db } from "@tasks/services"
import { getTableName } from "@common/helperts"

class Task extends BaseTask {
  static associate(models: Record<string, ModelStatic<Model>>) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Task.belongsTo(models["User"]!, {
      foreignKey: "assignedTo",
      as: "assignedUser",
    })
  }
}

Task.init({
  id: INT_PK,
  publicId: UUIDV4_DEFAULT_UNIQUE,
  assignedTo: {
    ...UUIDV4,
    references: {
      model: {
        tableName: "tasks_Users",
      },
      key: "publicId",
    },
  },
  title: {
    type: DataTypes.STRING,
    unique: true,
    validate: {
      not: /\[|\]/,
    },
  },
  jiraId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  status: ENUM_IN_MODEL(TASK_STATUSES, TASK_STATUSES.inProgress),
}, {
  sequelize: db,
  tableName: getTableName(SERVICES.tasks, Task.name),
})

export { Task }
