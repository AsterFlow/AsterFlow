import { type Express } from 'express'
import { Response, toServerResponse } from "router"
import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"

type HeadersInit = string[][] | Record<string, string | ReadonlyArray<string>> | Headers

export default new Driver({
  runtime: Runtime.Express,
  listen(instance: Express, params) {
    instance.all('*', async (req: Request, res: Express.Response) => {
      if (!this.onRequest) {
        return new Response().notFound({
          statusCode: 500,
          error: "Internal Server Error",
          message: `The onRequest() function must be defined before the listen() function.`
        }).toResponse()
      }
      const result = toServerResponse(await this.onRequest(request, new Response()), response)
      request = await this.onRequest(req, new Response()).toResponse()
    })

    instance.listen(params)
    return instance
  },
})
