import express from "express"
import expressAsyncHandler from "express-async-handler"
import { v4 as uuidv4 } from "uuid"

import {
  EVENT_NAMES,
  MB_EXCHANGES,
  SERVICES,
  TASK_STATUSES,
  USER_ROLES,
} from "@common/constants"
import { Task, User } from "@tasks/models"
import type {
  TaskAddedV1,
  TaskCompletedV1,
  TaskCreatedV2,
  TasksReassignedV1,
} from "@common/contracts"
import { getRandomArrEl } from "@tasks/helpers"
import { messageBroker } from "@tasks/services"

const tasksRouter = express.Router()

tasksRouter.post("/create", expressAsyncHandler(async (req, res) => {
  const { title, jiraId, userId, callerId, callerRole } = req.body

  if (!title) {
    res.send(422).json({
      code: 422,
      body: {
        result: "error",
        message: "title is required",
      },
    })
    return
  }

  if (callerRole === USER_ROLES.admin && !userId) {
    res.send(422).json({
      code: 422,
      body: {
        result: "error",
        message: "userId is required",
      },
    })
    return
  }

  const assignedTo = callerRole === USER_ROLES.user ? callerId : userId

  const task = await Task.create({ title, jiraId, assignedTo })

  {
    const dataToStream: TaskAddedV1 = {
      meta: {
        eventId: uuidv4(),
        name: EVENT_NAMES.task_added,
        version: 1,
        producer: SERVICES.tasks_service,
        emittedAt: Date.now(),
      },
      data: {
        publicId: task.publicId,
        assignedTo: task.assignedTo,
      },
    }

    messageBroker.publishEvent(MB_EXCHANGES.task_lifecycle, dataToStream)
  }

  {
    const dataToStream: TaskCreatedV2 = {
      meta: {
        eventId: uuidv4(),
        name: EVENT_NAMES.task_created,
        version: 2,
        producer: SERVICES.tasks_service,
        emittedAt: Date.now(),
      },
      data: {
        publicId: task.publicId,
        assignedTo: task.assignedTo,
        title: task.title,
        jiraId: task.jiraId,
      },
    }

    messageBroker.publishEvent(MB_EXCHANGES.task_stream, dataToStream)
  }

  res.status(201).json({
    result: "ok",
    data: task,
  })
}))

tasksRouter.post("/complete", expressAsyncHandler(async (req, res) => {
  const { taskId, callerId } = req.body

  const task = await Task.findOne({ where: { publicId: taskId }})

  if (!task) {
    res.status(404).json({
      result: "error",
      message: "Task not found",
    })
    return
  }

  if (task.assignedTo !== callerId) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this task",
    })
    return
  }

  await task.update({ status: TASK_STATUSES.completed })

  const dataToStream: TaskCompletedV1 = {
    meta: {
      eventId: uuidv4(),
      name: EVENT_NAMES.task_completed,
      version: 1,
      producer: SERVICES.tasks_service,
      emittedAt: Date.now(),
    },
    data: {
      publicId: task.publicId,
      assignedTo: task.assignedTo,
    },
  }

  messageBroker.publishEvent(MB_EXCHANGES.task_lifecycle, dataToStream)

  res.json({ result: "ok" })
}))

tasksRouter.post("/reassign", expressAsyncHandler(async (req, res) => {
  const { callerRole } = req.body

  if (callerRole === USER_ROLES.user) {
    res.status(401).json({
      result: "error",
      message: "You don't have access to this route",
    })
    return
  }

  const [ users, tasks ] = await Promise.all([
    User.findAll({
      where: { role: USER_ROLES.user },
      attributes: ["publicId"],
    }),
    Task.findAll({
      where: { status: TASK_STATUSES.inProgress },
      attributes: [ "id", "publicId", "assignedTo" ],
    }),
  ])

  if (users.length === 0) {
    res.status(500).json({
      result: "error",
      message: "No users found in DB",
    })
    return
  }

  await Promise.all(tasks.map(task => {
    const randomUser = getRandomArrEl(users) as User

    return task.update({ assignedTo: randomUser.publicId })
  }))

  const dataToStream: TasksReassignedV1 = {
    meta: {
      eventId: uuidv4(),
      name: EVENT_NAMES.tasks_reassigned,
      version: 1,
      producer: SERVICES.tasks_service,
      emittedAt: Date.now(),
    },
    data: tasks.map(task => {
      return { publicId: task.publicId, assignedTo: task.assignedTo }
    }),
  }

  messageBroker.publishEvent(MB_EXCHANGES.task_lifecycle, dataToStream)

  res.json({ result: "ok" })
}))

export { tasksRouter }
