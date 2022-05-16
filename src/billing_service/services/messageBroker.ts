import type { ConsumeMessage } from "amqplib"

import { EVENT_NAMES, MB_EXCHANGES, TASK_STATUSES } from "@common/constants"
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
import { env } from "@billing/env"
import { isCertainEvent } from "@common/helperts"

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
          await Task.upsert(content.data)
        } else if (isCertainEvent<TaskCompletedV1>(
          content,
          EVENT_NAMES.task_completed,
        )) {
          await Task.update(
            { status: TASK_STATUSES.completed },
            { where: { publicId: content.data.publicId } },
          )
        } else if (isCertainEvent<TasksReassignedV1>(
          content,
          EVENT_NAMES.tasks_reassigned,
        )) {
          const tasks = await Task.findAll({
            where: {
              publicId: content.data.map(task => task.publicId),
            },
          })

          await Promise.all(tasks.map(task => task.update({
            assignedTo: content.data.find(taskInEv =>
              task.publicId === taskInEv.publicId)?.assignedTo,
          })))
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
        }
        this.channel.ack(msg)
      }
    }.bind(messageBroker),
  )
}

export { messageBroker, initMessageBroker }
