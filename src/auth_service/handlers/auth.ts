import crypto from "crypto"
import nJwt from "njwt"
import { promisify } from "util"
import secureRandom from "secure-random"
import { v4 as uuidv4 } from "uuid"

import {
  EVENT_NAMES,
  MB_EXCHANGES,
  SERVICES,
  USER_ROLES,
} from "@common/constants"
import { User } from "@auth/models"
import type { UserCreatedV1 } from "@common/contracts"
import { env } from "@auth/env"
import { messageBroker } from "@auth/services"

const pbkdf2 = promisify(crypto.pbkdf2)
const generatePassword = (
  password: crypto.BinaryLike,
  salt: crypto.BinaryLike,
) => pbkdf2.call(null, password, salt, 310000, 32, "sha256")

const handleUserSignup = async (
  email: string,
  password: string,
  role = "user",
) => {
  const salt = secureRandom(16, { type: "Buffer" })
  const passwordHash = await generatePassword(password, salt)
    .then(buf => buf.toString("hex"))

  const user = await User.create({
    email,
    passwordHash,
    role,
    salt: salt.toString("hex"),
  })

  const dataToStream: UserCreatedV1 = {
    meta: {
      eventId: uuidv4(),
      name: EVENT_NAMES.user_created,
      version: 1,
      producer: SERVICES.auth_service,
      emittedAt: Date.now(),
    },
    data: {
      publicId: user.publicId,
      email: user.email,
      role: user.role as USER_ROLES,
    },
  }

  messageBroker.publishEvent(MB_EXCHANGES.user_stream, dataToStream)

  return {
    code: 201,
    body: { result: "ok", data: { publicId: user.publicId }},
  }
}

const handleUserLogin = async (email: string, password: string) => {
  const user = await User.findOne({ where: { email }})

  if (!user) {
    return {
      code: 422,
      body: {
        result: "error",
        message: "Email or password are incorrect",
      },
    }
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
    return {
      code: 422,
      body: {
        result: "error",
        message: "Email or password are incorrect",
      },
    }
  }

  const claims = {
    sub: user.publicId,
    scope: user.role,
  }

  const token = nJwt.create(claims, env.JWT_SECRET)
  token.setExpiration(Date.now() + (1000 * 60 * 15))

  return {
    code: 200,
    body: { result: "ok", token: token.compact() },
  }
}

export { handleUserSignup, handleUserLogin }
