import type { EVENT_TYPES, USER_ROLES } from "./constants"

interface Event {
  meta: {
    name: string
    type: EVENT_TYPES
  }
  data: unknown
}

interface UserCreatedCudEvent extends Event {
  data: {
    publicId: string
    email: string
    role: USER_ROLES
  }
}

interface TaskAddedBeEvent extends Event {
  data: {
    publicId: string
    assignedTo: string
  }
}

interface TaskCompletedBeEvent extends Event {
  data: {
    publicId: string
  }
}

interface TasksReassignedBeEvent extends Event {
  data: {
    publicIds: string[]
  }
}

interface TaskCreatedCudEvent extends Event {
  data: {
    publicId: string
    description: string
  }
}

export {
  Event,
  UserCreatedCudEvent,
  TaskAddedBeEvent,
  TaskCompletedBeEvent,
  TasksReassignedBeEvent,
  TaskCreatedCudEvent,
}
