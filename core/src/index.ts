import { z } from 'zod'
import { AsterFlow } from './controllers/asterflow'
import { Method, Router } from 'router'
import { drivers, Runtime } from 'driver'
import fastify from 'fastify'

type Responders<TData = unknown> = {
  200: {
    asdasd: string,
    data: TData
  }
}

const router = new Router({
  path: '/create',
  schema: {
    get: z.object({
      test: z.string()
    })
  },
  methods: {
    get({ response, schema, request }) {
      request.method
      return response.code(200).send({
        message: 'Hello'
      })
    }
  }
})

const method = new Method({
  method: 'get',
  path: '/',
  handle: ({ response }) => {
    return response.json({})
  }
})

const aster = new AsterFlow({ driver: drivers. })
aster.listen({ port: 4000 })

type ListRouters<T> = T extends AsterFlow<any, infer Routers> ? Routers : never
type Routes = ListRouters<typeof aster>
