import { User } from "@tasks/models"
import type { UserCreatedV1 } from "@common/contracts"

const handleUserCreated = async (data: UserCreatedV1["data"]) => {
  await User.upsert(data)
}

export { handleUserCreated }
