import { Op } from "sequelize"
import asyncHandler from "express-async-handler"
import express from "express"

import { Balance, Transaction } from "@billing/models"
import { TRANSACTION_STATUSES, USER_ROLES } from "@common/constants"
import { getBillingCycleRange } from "@billing/helpers"

const analyticsRouter = express.Router()

analyticsRouter.get("/company-balance", asyncHandler(async (req, res) => {
  const { callerRole } = req.body
  const { date } = req.query

  if (callerRole !== USER_ROLES.admin && callerRole !== USER_ROLES.analytic) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  let params = {}

  if (date) {
    const [ year, month, day ] = (date as string).split("-")
    if (!year || !month || !day) {
      res.status(422).json({
        result: "error",
        message: "Malformed date query parameter",
      })
      return
    }

    params = { year: +year, month: +month, day: +day }
  }

  const { start, end } = getBillingCycleRange(params)

  console.log(start, end)

  const transactions = await Transaction.findAll({
    where: {
      recordedAt: { [Op.between]: [ start, end ]},
      status: {
        [Op.in]: [
          TRANSACTION_STATUSES.deduction,
          TRANSACTION_STATUSES.reward,
        ],
      },
    },
  })

  const companyBalance = transactions.reduce((acc, t) => acc - t.difference, 0)

  res.status(201).json({
    result: "ok",
    data: companyBalance,
  })
}))

analyticsRouter.get("/highest-task-reward", asyncHandler(async (req, res) => {
  const { callerRole } = req.body
  const { startDate, periodInDays } = req.query

  if (callerRole !== USER_ROLES.admin && callerRole !== USER_ROLES.analytic) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  if (!startDate) {
    res.status(422).json({
      result: "error",
      message: "startDate query parameter is required",
    })
    return
  }

  const [ year, month, day ] = (startDate as string).split("-")
  if (!year || !month || !day) {
    res.status(422).json({
      result: "error",
      message: "Malformed startDate query parameter",
    })
    return
  }

  const params = { year: +year, month: +month, day: +day, periodInDays }

  const { start, end } = getBillingCycleRange(params)

  const highestTaskReward = await Transaction.findOne({
    where: {
      recordedAt: { [Op.between]: [ start, end ]},
      status: TRANSACTION_STATUSES.reward,
    },
    order: [[ "difference", "DESC" ]],
  })

  const data = highestTaskReward?.difference
    ?? "No tasks were completed in this period"

  res.status(201).json({
    result: "ok",
    data,
  })
}))

analyticsRouter.get(
  "/negative-balance-count",
  asyncHandler(async (req, res) => {
    const { callerRole } = req.body

    if (callerRole !== USER_ROLES.admin && callerRole !== USER_ROLES.analytic) {
      res.status(401).json({
        result: "error",
        message: "You don't have access to this route",
      })
      return
    }

    const negativeBalanceCount = await Balance.count({
      where: { amount: { [Op.lt]: 0 }},
    })

    res.status(201).json({
      result: "ok",
      data: negativeBalanceCount,
    })
  }),
)

export { analyticsRouter }
