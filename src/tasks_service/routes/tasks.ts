import express from "express"

import {
  EVENT_NAMES,
  EVENT_TYPES,
  MB_EXCHANGES,
  USER_ROLES,
} from "@common/constants"
import { Task, User } from "@tasks/models"
import type {
  TaskAddedBeEvent,
  TaskCompletedBeEvent,
  TaskCreatedCudEvent,
  TasksReassignedBeEvent,
} from "@common/contracts"
import expressAsyncHandler from "express-async-handler"
import { getRandomArrEl } from "@tasks/helpers"
import { messageBroker } from "@tasks/services"

const tasksRouter = express.Router()

tasksRouter.post("/create", expressAsyncHandler(async (req, res) => {
  const { description, userPublicId, callerId, callerRole } = req.body

  const assignedTo = callerRole === USER_ROLES.user ? callerId : userPublicId

  const task = await Task.create({ description, assignedTo })

  {
    const dataToStream: TaskAddedBeEvent = {
      meta: {
        name: EVENT_NAMES.task_added,
        type: EVENT_TYPES.business,
      },
      data: {
        publicId: task.publicId,
        assignedTo: task.assignedTo,
      },
    }

    messageBroker.publishEvent(MB_EXCHANGES.be_tasks, dataToStream)
  }

  {
    const dataToStream: TaskCreatedCudEvent = {
      meta: {
        name: EVENT_NAMES.task_created,
        type: EVENT_TYPES.cud,
      },
      data: {
        publicId: task.publicId,
        description: task.description,
      },
    }

    messageBroker.publishEvent(MB_EXCHANGES.cud_tasks, dataToStream)
  }

  res.status(201).json({
    result: "ok",
    data: task,
  })
}))

tasksRouter.post("/complete", expressAsyncHandler(async (req, res) => {
  const { taskId, callerId } = req.body

  const task = await Task.findOne({ where: { publicId: taskId } })

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

  await task.update({ isCompleted: true })

  const dataToStream: TaskCompletedBeEvent = {
    meta: {
      name: EVENT_NAMES.task_completed,
      type: EVENT_TYPES.business,
    },
    data: {
      publicId: task.publicId,
    },
  }

  messageBroker.publishEvent(MB_EXCHANGES.be_tasks, dataToStream)

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
      where: { isCompleted: false },
      attributes: ["id", "publicId", "assignedTo"] }),
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

  const dataToStream: TasksReassignedBeEvent = {
    meta: {
      name: EVENT_NAMES.task_completed,
      type: EVENT_TYPES.business,
    },
    data: {
      publicIds: tasks.map(task => task.publicId),
    },
  }

  messageBroker.publishEvent(MB_EXCHANGES.be_tasks, dataToStream)

  res.json({ result: "ok" })
}))

export { tasksRouter }
