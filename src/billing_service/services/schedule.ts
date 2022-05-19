import { CronJob } from "cron"

import { handleBillingCycleEnd } from "@billing/handlers"

const scheduledJob = new CronJob(
  "0 0 * * *",
  handleBillingCycleEnd,
  null,
  false,
  "UTC",
)

export { scheduledJob }
