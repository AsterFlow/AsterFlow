import type { FastifyInstance } from 'fastify'
import { Response } from '@asterflow/router'
import { Driver } from '../controllers/Driver'
import { Runtime } from '../types/driver'

export default new Driver({
  runtime: Runtime.Fastify,
  listen(instance: FastifyInstance, params, callback) {
    instance.all('*', async (request) => {
      if (!this.onRequest) return new Response().notFound({
        statusCode: 500,
        error: 'Internal Server Error',
        message: 'The onRequest() function must be defined before the listen() function.'
      })

      return (await this.onRequest(request, new Response())).toResponse()
    })

    instance.listen(params, callback)
  },
})
