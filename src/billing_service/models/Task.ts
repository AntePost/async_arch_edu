import { DataTypes, Model, ModelStatic } from "sequelize"

import { BaseTask } from "@common/models/BaseTask"
import { TASK_STATUSES } from "@common/constants"
import { db } from "@billing/services"
import { getEnumValues } from "@common/helperts"

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
  assignedTo: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: {
        tableName: "billing_Users",
      },
      key: "publicId",
    },
    validate: {
      isUUID: 4,
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: true,
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
  status: {
    type: DataTypes.STRING,
    defaultValue: TASK_STATUSES.inProgress,
    validate: {
      isIn: [getEnumValues(TASK_STATUSES)],
    },
  },
}, {
  sequelize: db,
  tableName: "billing_Tasks",
})

export { Task }
