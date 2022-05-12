import rabbitmq, { Channel } from "amqplib"

class RabbitMQ {
  channel!: Channel

  constructor(private authData: {
    hostname: string,
    port: number,
    username: string,
    password: string
  }) { }

  async init() {
    const { hostname, port, username, password } = this.authData

    const connection = await rabbitmq.connect({
      hostname,
      port,
      username,
      password,
    })
    this.channel = await connection.createChannel()
  }

  async assertExchange(name: string, type: string) {
    await this.channel.assertExchange(name, type)
  }

  async assertQueue(queue: string) {
    await this.channel.assertQueue(queue)
  }

  async bindQueue(queue: string, exchange: string, pattern = "") {
    await this.channel.bindQueue(queue, exchange, pattern)
  }

  publishEvent(exchange: string, data: object, routingKey = "") {
    const content = Buffer.from(JSON.stringify(data))

    this.channel.publish(exchange, routingKey, content)
  }

  consumeEvent(
    queue: string,
    cb: (msg: rabbitmq.ConsumeMessage | null) => void,
  ) {
    this.channel.consume(queue, cb)
  }
}

export { RabbitMQ }
