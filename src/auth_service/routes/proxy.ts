import type { Request } from "express-jwt"
import asyncHandler from "express-async-handler"
import axios from "axios"
import express from "express"

import { env } from "@auth/env"

const servicesToPorts: Record<string, number> = {
  tasks: env.TASKS_SERVICE_PORT,
  balances: env.BILLING_SERVICE_PORT,
  transactions: env.BILLING_SERVICE_PORT,
  analytics: env.BILLING_SERVICE_PORT,
}

const proxyRouter = express.Router()

proxyRouter.all(/.*/, asyncHandler(async (req: Request, res) => {
  const service = req.path.match(/\/(.*?)\//)?.[1]

  if (!service) {
    throw new Error("Route not found")
  }

  const port = servicesToPorts[service]

  const qs = req.url.match(/\?.+/)?.[0] ?? ""

  const options = {
    url: `http://localhost:${port}${req.path}${qs}`,
    method: req.method,
    data: {
      ...req.body,
      callerId: req.auth.sub,
      callerRole: req.auth.scope,
    },
  }

  const { data } = await axios.request(options)
  res.json(data)
}))

export { proxyRouter }
