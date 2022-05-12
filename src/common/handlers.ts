import { AxiosError } from "axios"
import type { ErrorRequestHandler } from "express"

const expressErrorHandler: ErrorRequestHandler = ((err, _req, res, _next) => {
  if (err instanceof AxiosError && err.response) {
    const axRes = err.response
    delete axRes.request
    console.error(axRes)

    return res.status(502).json({
      result: "error",
      message: axRes.statusText,
    })
  }

  if (err instanceof AxiosError) {
    delete err.request
  }

  console.error(err)

  if (err.message === "Route not found") {
    return res.status(404).json({
      result: "error",
      message: err.message,
    })
  }

  return res.status(500).json({
    result: "error",
    message: err.message,
  })
})

export { expressErrorHandler }
