import type { AxiosInstance } from "axios"

const seedAuth = async (axios: AxiosInstance) => {
  const promises = []
  for (let i = 0; i < 5; i++) {
    promises.push(axios.post("/auth/signup", {
      email: `user${i}@example.com`,
      password: "12345",
    }))
  }

  const res = await Promise.all(promises)

  return res.map(el => el.data.data.publicId) as string[]
}

export { seedAuth }
