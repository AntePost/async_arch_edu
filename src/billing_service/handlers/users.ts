import { Balance, User } from "@billing/models"
import type { UserCreatedV1 } from "@common/contracts"

const handleUserCreated = async (data: UserCreatedV1["data"]) => {
  await User.upsert(data)
    .then(_ => Balance.create({ userId: data.publicId }))
}

export { handleUserCreated }
