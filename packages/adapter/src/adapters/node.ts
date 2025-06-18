import { createNodeRequest } from '@asterflow/request'
import { AsterResponse } from '@asterflow/response'
import { createServer } from 'http'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'
import { toErrorResponse } from '../utils/errorHandler'

export default new Adapter({
  runtime: Runtime.Node,
  listen(params, callback) {
    return new Promise<void>((resolve, reject) => {
      const server = createServer(async (request, response) => {
        if (!this.onRequest) return new AsterResponse().notFound({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'The onRequest() function must be defined before the listen() function.'
        })

        try {
          return (await this.onRequest(createNodeRequest(request)))
            .toServerResponse(response)
        } catch (err) {
          return toErrorResponse(err).toServerResponse(response)
        }
      })
      
      server.on('error', (err) => {
        callback?.(err as Error)
        reject(err)
      })

      server.listen(params, () => {
        callback?.(null)
        resolve()
      })
    })
  }
})