import { cleanEnv, host, num, str } from "envalid"

const env = cleanEnv(process.env, {
  NODE_ENV: str({ default: "development", choices: [
    "production",
    "development",
    "test",
  ]}),
  BILLING_SERVICE_PORT: num(),
  DB_CONNECTION: str({ choices: [ "mysql", "mariadb", "postgres", "mssql" ]}),
  DB_HOST: host(),
  DB_PORT: num(),
  DB_DATABASE: str(),
  DB_USERNAME: str(),
  DB_PASSWORD: str(),
  RABBITMQ_HOST: str(),
  RABBITMQ_PORT: num(),
  RABBITMQ_USERNAME: str(),
  RABBITMQ_PASSWORD: str(),
})

export { env }
