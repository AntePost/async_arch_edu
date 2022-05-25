import asyncHandler from "express-async-handler"
import express from "express"

import { handleUserLogin, handleUserSignup } from "@auth/handlers"

const authRouter = express.Router()

authRouter.post("/signup", asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const result = await handleUserSignup(email, password)

  res.status(result.code).json(result.body)
}))

authRouter.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const result = await handleUserLogin(email, password)

  res.status(result.code).json(result.body)
}))

export { authRouter }
