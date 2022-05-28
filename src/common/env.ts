import { bool, cleanEnv, str } from "envalid"

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: "development", choices: [
    "production",
    "development",
    "test",
  ]}),
  RABBITMQ_DURABLE_QUEUE_BY_DEFAULT: bool(),
})

export { env }
