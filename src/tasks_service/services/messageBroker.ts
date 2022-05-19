import type { ConsumeMessage } from "amqplib"

import { DeadLetter, User } from "@tasks/models"
import { EVENT_NAMES, MB_EXCHANGES } from "@common/constants"
import type { Event, UserCreatedV1 } from "@common/contracts"
import { RabbitMQ } from "@common/rabbitMQ"
import { env } from "@tasks/env"
import { isCertainEvent } from "@common/helperts"

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

  messageBroker.consumeEvent(
    queueName,
    async function (this: typeof messageBroker, msg: ConsumeMessage | null) {
      if (msg) {
        const content = JSON.parse(msg.content.toString()) as Event
        let isErr = false

        if (isCertainEvent<UserCreatedV1>(content, EVENT_NAMES.user_created)) {
          await User.upsert(content.data)
            .catch(err => {
              console.log(
                `Error when handling ${EVENT_NAMES.task_added}. Data: `,
                content,
                " .Error: ",
                err,
              )
              isErr = true
            })
        } else {
          console.warn("Received unhandled message: ", JSON.stringify(msg))
          isErr = true
          return
        }

        if (!isErr) {
          this.consumeChannel.ack(msg)
        } else {
          this.consumeChannel.nack(msg, false, false)
        }
      }
    }.bind(messageBroker),
  )
}

export { messageBroker, initMessageBroker }
