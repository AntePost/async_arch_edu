const enum USER_ROLES {
  user = "user",
  manager = "manager",
  admin = "admin",
}

const enum MB_EXCHANGES {
  cud_user = "cud_user",
  cud_tasks = "cud_tasks",
  be_tasks = "be_tasks",
}

const enum EVENT_TYPES {
  cud,
  business,
}

const enum EVENT_NAMES {
  user_created = "user_created",
  task_added = "task_added",
  task_created = "task_created",
  task_completed = "task_completed",
  tasks_reassigned = "tasks_reassigned",
}

export { USER_ROLES, MB_EXCHANGES, EVENT_TYPES, EVENT_NAMES }
