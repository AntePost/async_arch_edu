import { Op } from "sequelize"
import asyncHandler from "express-async-handler"
import express from "express"

import { TRANSACTION_STATUSES, USER_ROLES } from "@common/constants"
import { Transaction } from "@billing/models"

const transactionsRouter = express.Router()

transactionsRouter.get("/my", asyncHandler(async (req, res) => {
  const { callerId, callerRole } = req.body

  if (callerRole !== USER_ROLES.user) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  const transactions = await Transaction.findAll({
    where: { userId: callerId },
    attributes: { exclude: [ "id", "createdAt", "updatedAt" ]},
  })

  res.status(201).json({
    result: "ok",
    data: transactions,
  })
}))

transactionsRouter.get("/all", asyncHandler(async (req, res) => {
  const { callerRole } = req.body

  if (callerRole !== USER_ROLES.admin && callerRole !== USER_ROLES.accountant) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  const balances = await Transaction.findAll({
    where: { status: { [Op.ne]: TRANSACTION_STATUSES.unclaimed_reward }},
    attributes: { exclude: [ "id", "createdAt", "updatedAt" ]},
  })

  res.status(201).json({
    result: "ok",
    data: balances,
  })
}))

export { transactionsRouter }
