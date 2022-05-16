enum USER_ROLES {
  user = "user",
  manager = "manager",
  admin = "admin",
}

enum TASK_STATUSES {
  inProgress = "inProgress",
  completed = "completed",
}

enum TRANSACTION_STATUSES {
  deduction = "deduction",
  unclaimed_reward = "unclaimed_reward",
  reward = "reward",
}

const enum MB_EXCHANGES {
  user_stream = "user_stream",
  task_stream = "task_stream",
  task_lifecycle = "task_lifecycle",
}

const enum EVENT_NAMES {
  user_created = "user_created",
  task_added = "task_added",
  task_created = "task_created",
  task_completed = "task_completed",
  tasks_reassigned = "tasks_reassigned",
}

const enum SERVICES {
  auth_service = "auth_service",
  tasks_service = "tasks_service",
  billing_service = "billing_service",
}

export {
  USER_ROLES,
  TASK_STATUSES,
  TRANSACTION_STATUSES,
  MB_EXCHANGES,
  EVENT_NAMES,
  SERVICES,
}
