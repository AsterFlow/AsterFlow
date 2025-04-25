import { Driver } from '../controllers/Driver'
import { Runtime } from '../types/driver'
import { Response } from '@asterflow/router'

export default new Driver({
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
        
          return (await this.onRequest(request, new Response())).toResponse()
        }})

      callback?.(null)
    } catch (err) {
      callback?.(err as Error)
    }
  },
})
