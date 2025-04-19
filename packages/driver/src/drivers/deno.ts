import { Response } from 'router'
import { Driver } from '../controllers/Driver'
import { Runtime } from '../types/driver'

export default new Driver({
  runtime: Runtime.Deno,
  listen(params) {
    return Deno.serve(params, async (request) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The onRequest() function must be defined before the listen() function.'
      }).toResponse()

      return (await this.onRequest(request, new Response())).toResponse()
    })
  },
})
