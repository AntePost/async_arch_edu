import "dotenv/config"
import bodyParser from "body-parser"
import express from "express"

import { db, initMessageBroker } from "@billing/services"
import { env } from "@billing/env"
import { expressErrorHandler } from "@common/handlers"

const port = env.BILLING_SERVICE_PORT

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

  app.use(expressErrorHandler)

  app.listen(port, () => console.log(`Server started on port ${port}`))
}

initApp()