import { Op } from "sequelize"

import { Balance, Transaction } from "@billing/models"
import { TRANSACTION_STATUSES } from "@common/constants"
import { getUnixTimestamp } from "@billing/helpers"

const handleBillingCycleEnd = async function() {
  console.log("Starting handling billing cycle end")

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const currentDay = now.getDate()
  const timezoneOffset = now.getTimezoneOffset()

  const previousDayStart = getUnixTimestamp(new Date(
    currentYear,
    currentMonth,
    currentDay - 1,
    0,
    -timezoneOffset,
  ))

  const previousDayEnd = getUnixTimestamp(new Date(
    currentYear,
    currentMonth,
    currentDay - 1,
    23,
    59 - timezoneOffset,
    59,
    999,
  ))

  const [ transactions, balances ] = await Promise.all([
    Transaction.findAll({ where: {
      recordedAt: { [Op.between]: [previousDayStart, previousDayEnd]},
      status: {
        [Op.in]: [
          TRANSACTION_STATUSES.deduction,
          TRANSACTION_STATUSES.reward,
        ],
      },
    }}),
    Balance.findAll(),
  ])

  console.log(`Found ${transactions.length} transactions`)

  const payments = transactions.reduce((acc, cur) => {
    const { userId, taskId, difference } = cur

    if (!acc[userId]) {
      acc[userId] = { taskId, difference }
    } else {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      acc[userId]!.difference += difference
    }

    return acc
  }, {} as Record<string, { taskId: string, difference: number }>)

  const nowTimestamp = getUnixTimestamp()

  const newTransactions = Object.entries(payments)
    .filter(([ , { difference }]) => difference !== 0)
    .map(([
      userId,
      { difference },
    ]) => ({
      userId,
      difference,
      status: difference > 0
        ? TRANSACTION_STATUSES.payout
        : TRANSACTION_STATUSES.carry_over,
      recordedAt: nowTimestamp,
    }))

  const updatedBalances = balances.map(b => {
    const change = newTransactions.find(t => t.userId === b.userId)?.difference
    if (!change || change <= 0) {
      return null
    }

    return b.update({ amount: 0 })
  })

  await Promise.all([
    Transaction.bulkCreate(newTransactions),
    ...updatedBalances,
  ])
  console.log("Finishing handling billing cycle end")
}

export { handleBillingCycleEnd }
