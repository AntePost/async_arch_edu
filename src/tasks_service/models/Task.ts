import { DataTypes, Model, ModelStatic } from "sequelize"

import { db } from "@tasks/services"

class Task extends Model {
  declare id: number
  declare publicId: string
  declare assignedTo: string
  declare description: string
  declare isCompleted: boolean

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
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  sequelize: db,
  tableName: "tasks_Tasks",
})

export { Task }
