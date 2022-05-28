import axios from "axios"
import dedent from "ts-dedent"
import { setTimeout } from "timers/promises"

import { initApp as auth } from "@auth/main"
import { initApp as billing } from "@billing/main"
import { initApp as tasks } from "@tasks/main"

import { db } from "@auth/services"
import { env } from "@auth/env"
import { handleUserSignup } from "@auth/handlers"
import { seedAuth } from "./auth"
import { seedTasks } from "./tasks"
import { squashWhitespace } from "@common/helperts"

const STARTUP_TIME_MS = 5000
const SHUTDOWN_TIME_MS = 20000

const host = "http://localhost"
const { AUTH_SERVICE_PORT, TASKS_SERVICE_PORT, BILLING_SERVICE_PORT } = env

const startSeeders = async () => {
  await db.query(dedent`DROP SCHEMA IF EXISTS public CASCADE;
    CREATE SCHEMA public;`)

  await Promise.all([
    auth(),
    tasks(),
    billing(),
  ])

  await setTimeout(STARTUP_TIME_MS)

  await handleUserSignup("admin@example.com", "12345", "admin")

  const { data } = await axios.post(
    `${host}:${AUTH_SERVICE_PORT}/auth/login`, {
      email: "admin@example.com",
      password: "12345",
    },
  )

  const authAxios = axios.create({
    baseURL: `${host}:${AUTH_SERVICE_PORT}`,
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  })

  const tasksAxios = axios.create({
    baseURL: `${host}:${TASKS_SERVICE_PORT}`,
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  })

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const billingAxios = axios.create({
    baseURL: `${host}:${BILLING_SERVICE_PORT}`,
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  })

  const userIds = await seedAuth(authAxios)
  await seedTasks(tasksAxios, userIds)
}

startSeeders()
  .then(_ => {
    console.log(squashWhitespace`Finished seeding, \
      waiting ${SHUTDOWN_TIME_MS / 1000} seconds for data to spread`)
  })
  .catch(err => {
    console.log(
      "Seeding failed. Error: ", err,
      `waiting ${SHUTDOWN_TIME_MS / 1000} seconds for data to spread`,
    )
  })
  .finally(async () => {
    await setTimeout(SHUTDOWN_TIME_MS)
    process.exit(0)
  })
