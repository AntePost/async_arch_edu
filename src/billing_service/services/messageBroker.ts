import type { ConsumeMessage } from "amqplib"

import {
  EVENT_NAMES,
  MB_EXCHANGES,
} from "@common/constants"
import type {
  Event,
  TaskAddedV1,
  TaskCompletedV1,
  TaskCreatedV2,
  TasksReassignedV1,
  UserCreatedV1,
} from "@common/contracts"
import {
  handleTaskAdded,
  handleTaskCompleted,
  handleTaskCreated,
  handleTasksReassigned,
  handleUserCreated,
} from "@billing/handlers"
import { DeadLetter } from "@billing/models"
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
  await messageBroker.init(DeadLetter)
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
          await handleUserCreated(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
        }
        this.consumeChannel.ack(msg)
      }
    }.bind(messageBroker),
  )

  messageBroker.consumeEvent(
    tasksStreamQueue,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event

        if (isCertainEvent<TaskCreatedV2>(content, EVENT_NAMES.task_created)) {
          await handleTaskCreated(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
        }
        this.consumeChannel.ack(msg)
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
          await handleTaskAdded(content.data)
        } else if (isCertainEvent<TaskCompletedV1>(
          content,
          EVENT_NAMES.task_completed,
        )) {
          await handleTaskCompleted(content.data)
        } else if (isCertainEvent<TasksReassignedV1>(
          content,
          EVENT_NAMES.tasks_reassigned,
        )) {
          await handleTasksReassigned(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
          return
        }
        this.consumeChannel.ack(msg)
      }
    }.bind(messageBroker),
  )
}

export { messageBroker, initMessageBroker }
