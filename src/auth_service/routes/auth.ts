import asyncHandler from "express-async-handler"
import crypto from "crypto"
import express from "express"
import nJwt from "njwt"
import { promisify } from "util"
import secureRandom from "secure-random"

import {
  EVENT_NAMES,
  EVENT_TYPES,
  MB_EXCHANGES,
  USER_ROLES,
} from "@common/constants"
import { User } from "@auth/models"
import type { UserCreatedCudEvent } from "@common/contracts"
import { env } from "@auth/env"
import { messageBroker } from "@auth/services"

const authRouter = express.Router()
const pbkdf2 = promisify(crypto.pbkdf2)
const generatePassword = (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
) => pbkdf2.call(null, password, salt, 310000, 32, "sha256")

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const salt = secureRandom(16, { type: "Buffer" })
  const passwordHash = await generatePassword(password, salt)
    .then(buf => buf.toString("hex"))

  const user = await User.create({
    email,
    passwordHash,
    salt: salt.toString("hex"),
  })

  user.toJSON()

  const dataToStream: UserCreatedCudEvent = {
    meta: {
      name: EVENT_NAMES.user_created,
      type: EVENT_TYPES.cud,
    },
    data: {
      publicId: user.publicId,
      email: user.email,
      role: user.role as USER_ROLES,
    },
  }

  messageBroker.publishEvent(MB_EXCHANGES.cud_user, dataToStream)

  res.status(201).json({ result: "ok" })
}))

authRouter.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ where: { email } })

  if (!user) {
    res.status(422).json({
      result: "error",
      message: "Email or password are incorrect",
    })
    return
  }

  const passwordHash = await generatePassword(
    password,
    Buffer.from(user.salt, "hex"),
  )

  const doesPasswordsMatch = crypto.timingSafeEqual(
    Buffer.from(user.passwordHash, "hex"),
    passwordHash,
  )

  if (!doesPasswordsMatch) {
    res.status(422).json({
      result: "error",
      message: "Email or password are incorrect",
    })
    return
  }

  const claims = {
    sub: user.publicId,
    scope: user.role,
  }

  const token = nJwt.create(claims, env.JWT_SECRET)
  token.setExpiration(Date.now() + (1000 * 60 * 15))

  res.json({ result: "ok", token: token.compact() })
}))

export { authRouter }
