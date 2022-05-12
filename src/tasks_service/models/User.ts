import { DataTypes, Model, ModelStatic } from "sequelize"

import { db } from "@tasks/services"

class User extends Model {
  declare id: number
  declare publicId: string
  declare email: string
  declare role: string

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
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: "user",
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize: db,
  tableName: "tasks_Users",
})

export { User }
