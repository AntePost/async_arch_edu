import type { ConsumeMessage } from "amqplib"

import { EVENT_NAMES, MB_EXCHANGES } from "@common/constants"
import type { Event, UserCreatedV1 } from "@common/contracts"
import { RabbitMQ } from "@common/rabbitMQ"
import { User } from "@tasks/models"
import { env } from "@tasks/env"

const messageBroker = new RabbitMQ({
  hostname: env.RABBITMQ_HOST,
  port: env.RABBITMQ_PORT,
  username: env.RABBITMQ_USERNAME,
  password: env.RABBITMQ_PASSWORD,
})

const queueName = `${MB_EXCHANGES.user_stream}_to_tasks`

const isUserCreatedCudEvent = (event: Event): event is UserCreatedV1 => {
  return event.meta.name === EVENT_NAMES.user_created
}

const initMessageBroker = async () => {
  await messageBroker.init()

  await messageBroker.assertExchange(MB_EXCHANGES.task_lifecycle, "fanout")
  await messageBroker.assertExchange(MB_EXCHANGES.task_stream, "fanout")

  await messageBroker.assertQueue(queueName)
  await messageBroker.bindQueue(queueName, MB_EXCHANGES.user_stream)

  messageBroker.consumeEvent(
    queueName,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event

        if (isUserCreatedCudEvent(content)) {
          await User.upsert(content.data)
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))

        }
        this.channel.ack(msg)
      }
    }.bind(messageBroker),
  )
}

export { messageBroker, initMessageBroker }
