import "dotenv/config"
import bodyParser from "body-parser"
import express from "express"
import { expressjwt } from "express-jwt"

import { authRouter, proxyRouter } from "@auth/routes"
import { db, initMessageBroker } from "@auth/services"
import { env } from "@auth/env"
import { expressErrorHandler } from "@common/handlers"

const port = env.AUTH_SERVICE_PORT
const unprotectedRoutes = [ "/auth/signup", "/auth/login" ]

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

  app.use(expressjwt({ secret: env.JWT_SECRET, algorithms: ["HS256"]})
    .unless({ path: unprotectedRoutes }))

  app.use("/auth", authRouter)
  app.use(proxyRouter)

  app.use(expressErrorHandler)

  app.listen(port, () => console.log(`Server started on port ${port}`))
}

initApp()
