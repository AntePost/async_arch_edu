import asyncHandler from "express-async-handler"
import express from "express"

import { Balance } from "@billing/models"
import { USER_ROLES } from "@common/constants"

const balanceRouter = express.Router()

balanceRouter.get("/my", asyncHandler(async (req, res) => {
  const { callerId, callerRole } = req.body

  if (callerRole !== USER_ROLES.user) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  const balance = await Balance.findOne({ where: { userId: callerId }})

  if (!balance) {
    throw new Error(`Failed to lookup balance for user ${balance}`)
  }

  res.status(201).json({
    result: "ok",
    data: balance.amount,
  })
}))

balanceRouter.get("/all", asyncHandler(async (req, res) => {
  const { callerRole } = req.body

  if (callerRole !== USER_ROLES.admin && callerRole !== USER_ROLES.accountant) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  const balances = await Balance.findAll({
    attributes: [ "publicId", "userId", "amount" ],
  })

  res.status(201).json({
    result: "ok",
    data: balances,
  })
}))

export { balanceRouter }
