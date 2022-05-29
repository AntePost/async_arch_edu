import { EVENT_NAMES, MB_EXCHANGES } from "@common/constants"
import { DeadLetter } from "@tasks/models"
import { RabbitMQ } from "@common/rabbitMQ"
import { env } from "@tasks/env"
import { handleUserCreated } from "@tasks/handlers"

const messageBroker = new RabbitMQ({
  hostname: env.RABBITMQ_HOST,
  port: env.RABBITMQ_PORT,
  username: env.RABBITMQ_USERNAME,
  password: env.RABBITMQ_PASSWORD,
}, "undelivered_to_tasks")

const queueName = `${MB_EXCHANGES.user_stream}_to_tasks`

const initMessageBroker = async () => {
  await messageBroker.init(DeadLetter)
    .then(_res => Promise.all([
      messageBroker.assertExchange(MB_EXCHANGES.task_lifecycle, "fanout"),
      messageBroker.assertExchange(MB_EXCHANGES.task_stream, "fanout"),
      messageBroker.assertQueue(queueName),
      messageBroker.bindQueue(queueName, MB_EXCHANGES.user_stream),
    ]))

  messageBroker.addEventHandlers(
    queueName,
    {
      [EVENT_NAMES.user_created]: handleUserCreated,
    },
  )
}

export { messageBroker, initMessageBroker }
