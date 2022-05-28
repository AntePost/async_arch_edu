import type { AxiosInstance } from "axios"

import { getRandomInt } from "@common/helperts"

const seedTasks = async (axios: AxiosInstance, userIds: string[]) => {
  const promises = []
  for (let i = 0; i < 30; i++) {
    const j = getRandomInt(0, userIds.length)
    promises.push(axios.post("/tasks/create", {
      title: `Task ${i}`,
      jiraId: Math.random() >= 0.5 ? null : `[jira_id: ${i}]`,
      userId: userIds[j],
    }))
  }

  const res = await Promise.all(promises)

  return res.map(el => el.data.data.publicId) as string[]
}

export { seedTasks }
