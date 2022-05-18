import { TASK_STATUSES, TRANSACTION_STATUSES } from "@common/constants"
import { Task, Transaction } from "@billing/models"
import type {
  TaskAddedV1,
  TaskCompletedV1,
  TaskCreatedV2,
  TasksReassignedV1,
} from "@common/contracts"
import { getRandomIntInclusive, getUnixTimestamp } from "@billing/helpers"

const deductionRange = [-20, -10] as const
const rewardRange = [20, 40] as const

const handleTaskCreated = async (data: TaskCreatedV2["data"]) => {
  await Task.upsert(data)
}

const handleTaskAdded = async (data: TaskAddedV1["data"]) => {
  const deduction = getRandomIntInclusive(...deductionRange)
  const reward = getRandomIntInclusive(...rewardRange)

  await Task.upsert(data)
    .then(_res => Promise.all([
      Transaction.create({
        userId: data.assignedTo,
        taskId: data.publicId,
        difference: deduction,
        status: TRANSACTION_STATUSES.deduction,
        recordedAt: getUnixTimestamp(),
      }),
      Transaction.create({
        taskId: data.publicId,
        difference: reward,
        status: TRANSACTION_STATUSES.unclaimed_reward,
      }),
    ]))
}

const handleTaskCompleted = async (data: TaskCompletedV1["data"]) => {
  await Promise.all([
    Task.update(
      { status: TASK_STATUSES.completed },
      { where: { publicId: data.publicId }},
    ),
    Transaction.update(
      {
        userId: data.assignedTo,
        status: TRANSACTION_STATUSES.reward,
        recordedAt: getUnixTimestamp(),
      },
      { where: {
        taskId: data.publicId,
        status: TRANSACTION_STATUSES.unclaimed_reward,
      }},
    ),
  ])
}

const handleTasksReassigned = async (data: TasksReassignedV1["data"]) => {
  const taskIds = data.map(task => task.publicId)

  const [ tasks, transactions ] = await Promise.all([
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
  ])

  const taskPromises = tasks.map(task => task.update({
    assignedTo: data.find(taskInEv =>
      taskInEv.publicId === task.publicId)?.assignedTo,
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
    transactionPromise,
  ])
}

export {
  handleTaskCreated,
  handleTaskAdded,
  handleTaskCompleted,
  handleTasksReassigned,
}
