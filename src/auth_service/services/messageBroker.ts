import { MB_EXCHANGES } from "@common/constants"
import { RabbitMQ } from "@common/rabbitMQ"
import { env } from "@auth/env"

const messageBroker = new RabbitMQ({
  hostname: env.RABBITMQ_HOST,
  port: env.RABBITMQ_PORT,
  username: env.RABBITMQ_USERNAME,
  password: env.RABBITMQ_PASSWORD,
})

const initMessageBroker = async () => {
  await messageBroker.init()
    .then(_res => Promise.all([
      messageBroker.assertExchange(MB_EXCHANGES.user_stream, "fanout"),
    ]))
}

export { messageBroker, initMessageBroker }
