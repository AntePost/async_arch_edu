import type { ConsumeMessage } from "amqplib"

import {
  EVENT_NAMES,
  MB_EXCHANGES,
  TASK_STATUSES,
  TRANSACTION_STATUSES,
} from "@common/constants"
import type {
  Event,
  TaskAddedV1,
  TaskCompletedV1,
  TaskCreatedV1,
  TasksReassignedV1,
  UserCreatedV1,
} from "@common/contracts"
import { Task, User } from "@billing/models"
import { RabbitMQ } from "@common/rabbitMQ"
import { Transaction } from "@billing/models/Transaction"
import { env } from "@billing/env"
import { getRandomIntInclusive } from "@billing/helpers"
import { isCertainEvent } from "@common/helperts"

const deductionRange = [-20, -10] as const
const rewardRange = [20, 40] as const

const messageBroker = new RabbitMQ({
  hostname: env.RABBITMQ_HOST,
  port: env.RABBITMQ_PORT,
  username: env.RABBITMQ_USERNAME,
  password: env.RABBITMQ_PASSWORD,
})

const userStreamQueue = `${MB_EXCHANGES.user_stream}_to_billing`
const tasksStreamQueue = `${MB_EXCHANGES.task_stream}_to_billing`
const tasksLifecycleQueue = `${MB_EXCHANGES.task_lifecycle}_to_billing`

const initMessageBroker = async () => {
  await messageBroker.init()
    .then(_res => Promise.all([
      messageBroker.assertQueue(userStreamQueue),
      messageBroker.bindQueue(userStreamQueue, MB_EXCHANGES.user_stream),
      messageBroker.assertQueue(tasksStreamQueue),
      messageBroker.bindQueue(tasksStreamQueue, MB_EXCHANGES.task_stream),
      messageBroker.assertQueue(tasksLifecycleQueue),
      messageBroker.bindQueue(tasksLifecycleQueue, MB_EXCHANGES.task_lifecycle),
    ]))

  messageBroker.consumeEvent(
    userStreamQueue,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event

        if (isCertainEvent<UserCreatedV1>(content, EVENT_NAMES.user_created)) {
          await User.upsert(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))

        }
        this.channel.ack(msg)
      }
    }.bind(messageBroker),
  )

  messageBroker.consumeEvent(
    tasksStreamQueue,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event

        if (isCertainEvent<TaskCreatedV1>(content, EVENT_NAMES.task_created)) {
          await Task.upsert(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
        }
        this.channel.ack(msg)
      }
    }.bind(messageBroker),
  )

  messageBroker.consumeEvent(
    tasksLifecycleQueue,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event

        if (isCertainEvent<TaskAddedV1>(
          content,
          EVENT_NAMES.task_added,
        )) {
          const { data } = content

          const deduction = getRandomIntInclusive(...deductionRange)
          const reward = getRandomIntInclusive(...rewardRange)

          await Task.upsert(data)
            .then(_res => Promise.all([
              Transaction.create({
                userId: data.assignedTo,
                taskId: data.publicId,
                difference: deduction,
                status: TRANSACTION_STATUSES.deduction,
              }),
              Transaction.create({
                taskId: data.publicId,
                difference: reward,
                status: TRANSACTION_STATUSES.unclaimed_reward,
              }),
            ]))
        } else if (isCertainEvent<TaskCompletedV1>(
          content,
          EVENT_NAMES.task_completed,
        )) {
          const { data } = content

          await Promise.all([
            Task.update(
              { status: TASK_STATUSES.completed },
              { where: { publicId: data.publicId } },
            ),
            Transaction.update(
              {
                userId: data.assignedTo,
                status: TRANSACTION_STATUSES.reward,
                claimedAt: Date.now(),
              },
              { where: {
                taskId: data.publicId,
                status: TRANSACTION_STATUSES.unclaimed_reward,
              } },
            ),
          ])
        } else if (isCertainEvent<TasksReassignedV1>(
          content,
          EVENT_NAMES.tasks_reassigned,
        )) {
          const { data } = content

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

          const transactionPromise = Transaction.bulkCreate(data.map(task => {
            return {
              taskId: task.publicId,
              userId: task.assignedTo,
              difference: transactions.find(tr => tr.taskId === task.publicId)
                ?.difference,
              status: TRANSACTION_STATUSES.deduction,
            }
          }))

          await Promise.all([
            ...taskPromises,
            transactionPromise,
          ])
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
          return
        }
        this.channel.ack(msg)
      }
    }.bind(messageBroker),
  )
}

export { messageBroker, initMessageBroker }
