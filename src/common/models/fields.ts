import { DataTypes } from "sequelize"

import { getEnumValues, mixKey, squashWhitespace } from "@common/helperts"
import type { EnumObject } from "@common/interfaces"

const INT_PK = {
  type: DataTypes.INTEGER,
  primaryKey: true,
  autoIncrement: true,
}

const INT = {
  type: DataTypes.INTEGER,
  validate: {
    isInt: true,
  },
}

const INT_DEFAULT = (defaultValue: number) => {
  if (!Number.isInteger(defaultValue)) {
    throw new Error(squashWhitespace`Value ${defaultValue}
    passed to INT_DEFAULT isn't an integer`)
  }

  return {
    type: DataTypes.INTEGER,
    defaultValue,
    validate: {
      isInt: true,
    },
  }
}

const INT_POSITIVE = {
  type: DataTypes.INTEGER,
  allowNull: true,
  validate: {
    isInt: true,
    min: 0,
  },
}

const UUIDV4 = {
  type: DataTypes.UUID,
  validate: {
    isUUID: 4,
  },
}

const UUIDV4_DEFAULT_UNIQUE = {
  ...UUIDV4,
  defaultValue: DataTypes.UUIDV4,
  unique: true,
}

const EMAIL_UNIQUE = {
  type: DataTypes.STRING,
  unique: true,
  validate: {
    isEmail: true,
  },
}

const ENUM_IN_MODEL =
  <E extends EnumObject>
  (values: E, defaultValue?: keyof E) => ({
    type: DataTypes.STRING,
    ...mixKey(defaultValue),
    validate: {
      isIn: [getEnumValues(values)],
    },
  })

export {
  INT_PK,
  INT,
  INT_DEFAULT,
  INT_POSITIVE,
  UUIDV4,
  UUIDV4_DEFAULT_UNIQUE,
  EMAIL_UNIQUE,
  ENUM_IN_MODEL,
}
