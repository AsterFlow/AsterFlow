import { FastifyRequest } from '@asterflow/request'
import { Response } from '@asterflow/response'
import type { FastifyInstance } from 'fastify'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'

export default new Adapter({
  runtime: Runtime.Fastify,
  async listen(instance: FastifyInstance, params, callback) {
    instance.all('*', async (request) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The onRequest() function must be defined before the listen() function.'
      })
      return (await this.onRequest(new FastifyRequest(request))).toResponse()
    })

    try {
      const address = await instance.listen(params)
      callback?.(null, address)
    } catch (err) {
      callback?.(err as Error, '')
    }
  },
})