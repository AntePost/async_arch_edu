import "dotenv/config"
import bodyParser from "body-parser"
import express from "express"

import { db, initMessageBroker } from "@tasks/services"
import { env } from "@tasks/env"
import { expressErrorHandler } from "@common/handlers"
import { tasksRouter } from "@tasks/routes"

const port = env.TASKS_SERVICE_PORT

const initApp = async () => {
  try {
    Promise.all([
      await db.authenticate().then(() => db.sync()),
      await initMessageBroker(),
    ])
  } catch (err) {
    console.error(err)
    return
  }

  const app = express()

  app.use(bodyParser.json())

  app.use("/tasks", tasksRouter)

  app.use(expressErrorHandler)

  app.listen(port, () => console.log(`Server started on port ${port}`))
}

export { initApp }
