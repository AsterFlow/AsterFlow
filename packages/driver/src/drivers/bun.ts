import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"
import { Response } from 'router'

export default new Driver({
  runtime: Runtime.Bun,
  listen(params) {
    return Bun.serve({ ...params, fetch: (request, server) => Driver.onRequest(request, new Response()) })
  },
})
