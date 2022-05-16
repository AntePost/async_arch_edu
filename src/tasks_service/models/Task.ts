import { DataTypes, Model, ModelStatic } from "sequelize"

import { TASK_STATUSES } from "@common/constants"
import { db } from "@tasks/services"
import { getEnumValues } from "@common/helperts"

class Task extends Model {
  declare id: number
  declare publicId: string
  declare assignedTo: string
  declare title: string
  declare jiraId: string
  declare status: TASK_STATUSES

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
    allowNull: false,
    references: {
      model: {
        tableName: "tasks_Users",
      },
      key: "publicId",
    },
    validate: {
      isUUID: 4,
    },
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      not: /\[|\]/,
    },
  },
  jiraId: {
    type: DataTypes.STRING,
    allowNull: false,
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
  tableName: "tasks_Tasks",
})

export { Task }