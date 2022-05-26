import { Balance, Task, Transaction } from "@billing/models"
import { TASK_STATUSES, TRANSACTION_STATUSES } from "@common/constants"
import type {
  TaskAddedV1,
  TaskCompletedV1,
  TaskCreatedV2,
  TasksReassignedV1,
} from "@common/contracts"
import { getRandomIntInclusive } from "@common/helperts"
import { getUnixTimestamp } from "@billing/helpers"

const deductionRange = [-20, -10] as const
const rewardRange = [20, 40] as const

const handleTaskCreated = async (data: TaskCreatedV2["data"]) => {
  await Task.upsert(data)
}

const handleTaskAdded = async (data: TaskAddedV1["data"]) => {
  const { assignedTo, publicId } = data

  const deduction = getRandomIntInclusive(...deductionRange)
  const reward = getRandomIntInclusive(...rewardRange)

  await Task.upsert(data)
    .then(_res => Promise.all([
      Transaction.create({
        userId: assignedTo,
        taskId: publicId,
        difference: deduction,
        status: TRANSACTION_STATUSES.deduction,
        recordedAt: getUnixTimestamp(),
      }),
      Transaction.create({
        taskId: publicId,
        difference: reward,
        status: TRANSACTION_STATUSES.unclaimed_reward,
      }),
      Balance.findOne({ where: { userId: assignedTo }}).then(b => {
        if (!b) {
          console.error("Failed to lookup up balance for user ", assignedTo)
          return
        }

        b.update({ amount: b.amount + deduction })
      }),
    ]))
}

const handleTaskCompleted = async (data: TaskCompletedV1["data"]) => {
  const { assignedTo, publicId } = data

  await Promise.all([
    Task.update(
      { status: TASK_STATUSES.completed },
      { where: { publicId }},
    ),
    Transaction.findOne({ where: {
      taskId: publicId,
      status: TRANSACTION_STATUSES.unclaimed_reward,
    }}).then(t => {
      if (!t) {
        console.error(
          "Failed to lookup up reward transaction for task ",
          publicId,
        )
        return
      }

      t.update(
        {
          userId: assignedTo,
          status: TRANSACTION_STATUSES.reward,
          recordedAt: getUnixTimestamp(),
        },
        { where: {
          taskId: publicId,
          status: TRANSACTION_STATUSES.unclaimed_reward,
        }},
      )
      Balance.findOne({ where: { userId: assignedTo }}).then(b => {
        if (!b) {
          console.error("Failed to lookup up balance for user ", assignedTo)
          return
        }

        b.update({ amount: b.amount + t.difference })
      })
    }),
  ])
}

const handleTasksReassigned = async (data: TasksReassignedV1["data"]) => {
  const { taskIds, userIds } = data.reduce((acc, { publicId, assignedTo }) => {
    acc.taskIds.push(publicId)
    acc.userIds.push(assignedTo)
    return acc
  }, { taskIds: [] as string[], userIds: [] as string[] })

  const [ tasks, transactions, balances ] = await Promise.all([
    Task.findAll({
      where: {
        publicId: taskIds,
      },
    }),
    Transaction.findAll({
      attributes: [
        "id",
        "taskId",
        "difference",
      ],
      where: {
        taskId: taskIds,
        status: TRANSACTION_STATUSES.deduction,
      },
    }),
    Balance.findAll({
      where: {
        userId: userIds,
      },
    }),
  ])

  const taskPromises = tasks.map(task => task.update({
    assignedTo: data.find(taskInEv =>
      taskInEv.publicId === task.publicId)?.assignedTo,
  }))

  const balanceChanges = data.reduce((acc, { publicId, assignedTo }) => {
    const amount = transactions.find(({ taskId }) => taskId === publicId)
      ?.difference
    if (!amount) {
      console.error(
        "Failed to lookup up deduction transaction for task ",
        publicId,
      )
      return acc
    }

    if (acc[assignedTo]) {
      acc[assignedTo] += amount
    } else {
      acc[assignedTo] = amount
    }
    return acc
  }, {} as Record<string, number>)

  const balancePromises = balances.map(b => b.update({
    amount: b.amount + balanceChanges[b.userId],
  }))

  const now = getUnixTimestamp()

  const transactionPromise = Transaction.bulkCreate(data.map(task => {
    return {
      taskId: task.publicId,
      userId: task.assignedTo,
      difference: transactions.find(tr => tr.taskId === task.publicId)
        ?.difference,
      status: TRANSACTION_STATUSES.deduction,
      recordedAt: now,
    }
  }))

  await Promise.all([
    ...taskPromises,
    ...balancePromises,
    transactionPromise,
  ])
}

export {
  handleTaskCreated,
  handleTaskAdded,
  handleTaskCompleted,
  handleTasksReassigned,
}
