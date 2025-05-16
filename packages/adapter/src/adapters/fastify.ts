import type { FastifyInstance } from 'fastify'
import { Response } from '@asterflow/router'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'
import { FastifyRequest } from '@asterflow/request'

export default new Adapter({
  runtime: Runtime.Fastify,
  listen(instance: FastifyInstance, params, callback) {
    instance.all('*', async (request) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The onRequest() function must be defined before the listen() function.'
      })

      return (await this.onRequest(new FastifyRequest(request))).toResponse()
    })

    instance.listen(params, callback)
  },
})
