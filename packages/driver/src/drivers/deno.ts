import { Response } from "router"
import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"

export default new Driver({
  runtime: Runtime.Deno,
  listen(params) {
    return Deno.serve(params, (request) => Driver.onRequest(request, new Response()))
  },
})
