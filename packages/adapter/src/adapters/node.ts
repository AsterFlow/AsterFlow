import { createServer } from 'http'
import { Response } from '@asterflow/response'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'
import { NodeRequest } from '@asterflow/request'
import { toErrorResponse } from '../utils/errorHandler'

export default new Adapter({
  runtime: Runtime.Node,
  listen(params, callback) {
    try {
      createServer(async (request, response) => {
        if (!this.onRequest) return new Response().notFound({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'The onRequest() function must be defined before the listen() function.'
        })

        try {
          return (await this.onRequest(new NodeRequest(request)))
            .toServerResponse(response)
        } catch (err) {
          return toErrorResponse(err).toServerResponse(response)
        }
      }).listen(params)
      
      callback?.(null)
    } catch (err) {
      callback?.(err as Error)
    }
  },
})
