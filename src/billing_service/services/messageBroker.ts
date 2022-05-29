import { EVENT_NAMES, MB_EXCHANGES } from "@common/constants"
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

const messageBroker = new RabbitMQ({
  hostname: env.RABBITMQ_HOST,
  port: env.RABBITMQ_PORT,
  username: env.RABBITMQ_USERNAME,
  password: env.RABBITMQ_PASSWORD,
}, "undelivered_to_billing")

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

  messageBroker.addEventHandlers(
    userStreamQueue,
    {
      [EVENT_NAMES.user_created]: handleUserCreated,
      [EVENT_NAMES.task_added]: handleTaskAdded,
      [EVENT_NAMES.task_completed]: handleTaskCompleted,
      [EVENT_NAMES.tasks_reassigned]: handleTasksReassigned,
      [EVENT_NAMES.task_created]: handleTaskCreated,
    },
  )
}

export { messageBroker, initMessageBroker }
