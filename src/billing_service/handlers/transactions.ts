import { Op } from "sequelize"

import { Balance, Transaction } from "@billing/models"
import { getBillingCycleRange, getUnixTimestamp } from "@billing/helpers"
import { TRANSACTION_STATUSES } from "@common/constants"

const handleBillingCycleEnd = async function() {
  console.log("Starting handling billing cycle end")

  const { start, end } = getBillingCycleRange({ dayOffset: -1 })

  const [ transactions, balances ] = await Promise.all([
    Transaction.findAll({ where: {
      recordedAt: { [Op.between]: [ start, end ]},
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
    .filter(([ , { difference } ]) => difference !== 0)
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
