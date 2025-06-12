import { BunRequest } from '@asterflow/request'
import { Response } from '@asterflow/response'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'

export default new Adapter({
  runtime: Runtime.Bun,
  listen(params, callback) {
    try {
      Bun.serve({ ...params, 
        fetch: async (request) => {
          if (!this.onRequest) return new Response().notFound({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'The onRequest() function must be defined before the listen() function.'
          }).toResponse()
        
          return (await this.onRequest(new BunRequest(request))).toResponse()
        }})

      callback?.(null)
    } catch (err) {
      callback?.(err as Error)
    }
  },
})
