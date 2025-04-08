import { Response, toServerResponse } from "router"
import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"
import { createServer } from 'http'
type HeadersInit = string[][] | Record<string, string | ReadonlyArray<string>> | Headers;

export default new Driver({
  runtime: Runtime.Node,
  listen(params) {
    return createServer(async (request, response) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: "Internal Server Error",
        message: `The onRequest() function must be defined before the listen() function.`
      })

      return toServerResponse(await this.onRequest(request, new Response()), response)
    }).listen(params)
  },
})
