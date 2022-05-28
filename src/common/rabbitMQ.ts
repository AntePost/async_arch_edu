import type { Model, ModelStatic } from "sequelize"
import rabbitmq, { Channel, ConfirmChannel } from "amqplib"
import dedent from "ts-dedent"
import { setTimeout } from "timers/promises"

import { env } from "./env"
import { getRandomInt } from "./helperts"

interface DeadLetterModelFields {
  exchange: string,
  routing_key: string,
  data: string,
}

class RabbitMQ {
  consumeChannel!: Channel
  private publishChannel!: ConfirmChannel
  private deadLetterModel!: ModelStatic<Model>
  private hasUndelivered = false
  private retryAttempt = -1
  private maxBackoff = 10000

  constructor(private authData: {
      hostname: string,
      port: number,
      username: string,
      password: string
    }, private deadLetterExchange: string) {}

  async init(deadLetterModel: ModelStatic<Model>) {
    const { hostname, port, username, password } = this.authData

    const connection = await rabbitmq.connect({
      hostname,
      port,
      username,
      password,
    })
    this.consumeChannel = await connection.createChannel()
    this.publishChannel = await connection.createConfirmChannel()

    this.deadLetterModel = deadLetterModel
    this.assertExchange(this.deadLetterExchange, "direct")
    this.assertQueue(`${this.deadLetterExchange}_q`, false)
    this.bindQueue(`${this.deadLetterExchange}_q`, this.deadLetterExchange)

    const undeliveredCount = await this.deadLetterModel.count()
    if (undeliveredCount) {
      console.log(`Found ${undeliveredCount} undelivered messages. Resending.`)

      this.hasUndelivered = true
      this.handleUndelivered()
    }
  }

  async assertExchange(name: string, type: string) {
    await this.publishChannel.assertExchange(name, type)
  }

  async assertQueue(
    queue: string,
    hasDeadLetter = true,
    durable = env.isProd
      ? true
      : env.RABBITMQ_DURABLE_QUEUE_BY_DEFAULT,
  ) {
    await this.consumeChannel.assertQueue(
      queue,
      {
        deadLetterExchange: hasDeadLetter
          ? this.deadLetterExchange
          : undefined,
        durable,
      },
    )
  }

  async bindQueue(queue: string, exchange: string, pattern = "") {
    await this.consumeChannel.bindQueue(queue, exchange, pattern)
  }

  async publishEvent(exchange: string, data: object, routingKey = "") {
    const content = Buffer.from(JSON.stringify(data))

    try {
      this.publishChannel.publish(exchange, routingKey, content)
      await this.publishChannel.waitForConfirms()

      return true
    } catch (err) {
      this.handlePublishNack(exchange, data, routingKey)

      console.error(dedent`Failed to publish message to queue.
        \nExchange ${exchange}, routing key ${routingKey}.
        \n--- Data: `, data, "\n--- Error: ", err)

      return false
    }
  }

  private getCurrentBackoff() {
    if (this.retryAttempt++ === -1) {
      return 0
    }

    return Math.min(
      ((2000 ^ this.retryAttempt++) + getRandomInt(1, 1000)),
      this.maxBackoff,
    )
  }

  private async handlePublishNack(
    exchange: string,
    data: object,
    routingKey: string,
  ) {
    await this.deadLetterModel.create({
      exchange,
      data: JSON.stringify(data),
      routingKey,
    })

    if (!this.hasUndelivered) {
      this.hasUndelivered = true
      this.handleUndelivered()
    }
  }

  private async republishUndelivered() {
    const oldestUndelivered = await this.deadLetterModel.findOne({ order: [[
      "createdAt", "ASC",
    ]]}) as Model & DeadLetterModelFields

    if (!oldestUndelivered) {
      this.hasUndelivered = false
      return
    }

    await setTimeout(this.getCurrentBackoff())

    const { exchange, routing_key, data } = oldestUndelivered
    const res = await this.publishEvent(
      exchange,
      JSON.parse(data),
      routing_key ?? "",
    )

    if (res) {
      this.retryAttempt = -1
      await oldestUndelivered.destroy()
    }
  }

  private async handleUndelivered() {
    while(this.hasUndelivered) {
      // eslint-disable-next-line no-await-in-loop
      await this.republishUndelivered()
    }
    console.log("All undelivered messages has been sent")
  }

  consumeEvent(
    queue: string,
    cb: (msg: rabbitmq.ConsumeMessage | null) => void,
  ) {
    this.consumeChannel.consume(queue, cb)
  }
}

export { RabbitMQ }
