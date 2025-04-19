import { createServer } from 'http'
import { Response } from 'router'
import { Driver } from '../controllers/Driver'
import { Runtime } from '../types/driver'

export default new Driver({
  runtime: Runtime.Node,
  listen(params) {
    return createServer(async (request, response) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The onRequest() function must be defined before the listen() function.'
      })

      return (await this.onRequest(request, new Response())).toServerResponse(response)
    }).listen(params)
  },
})
