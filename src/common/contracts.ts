import type { EVENT_NAMES, SERVICES, USER_ROLES } from "./constants"

interface Event {
  meta: {
    id: string
    name?: EVENT_NAMES
    version?: number
    producer?: SERVICES
    emittedAt: number
  }
  data: unknown
}

type UserCreatedV1 = Event & {
  meta: {
    name: EVENT_NAMES.user_created
    version: 1
    producer: SERVICES.auth_service
  }
  data: {
    publicId: string
    email: string
    role: USER_ROLES
  }
}

type TaskAddedV1 = Event & {
  meta: {
    name: EVENT_NAMES.task_added
    version: 1
    producer: SERVICES.tasks_service
  }
  data: {
    publicId: string
    assignedTo: string
  }
}

type TaskCompletedV1 = Event & {
  meta: {
    name: EVENT_NAMES.task_completed
    version: 1
    producer: SERVICES.tasks_service
  }
  data: {
    publicId: string
    assignedTo: string
  }
}

type TasksReassignedV1 = Event & {
  meta: {
    name: EVENT_NAMES.tasks_reassigned
    version: 1
    producer: SERVICES.tasks_service
  }
  data: {
    publicId: string
    assignedTo: string
  }[]
}

type TaskCreatedV1 = Event & {
  meta: {
    name: EVENT_NAMES.task_created
    version: 2
    producer: SERVICES.tasks_service
  }
  data: {
    publicId: string
    title: string
    jiraId: string
  }
}

export {
  Event,
  UserCreatedV1,
  TaskAddedV1,
  TaskCompletedV1,
  TasksReassignedV1,
  TaskCreatedV1,
}
