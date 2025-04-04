import { z } from 'zod'
import { AsterFlow } from './controllers/asterflow'
import { Router } from 'router'
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
    get({ reply, schema }) {
      return reply.code(200).send({
        message: 'Hello'
      })
    }
  }
})

const aster = new AsterFlow<Responders>()
  .router({
    basePath: '/v1',
    controllers: [router]
  })
  .controller(router)

await aster.listen({ port: 3008 })

type ListRouters<T> = T extends AsterFlow<any, infer Routers> ? Routers : never
type Routes = ListRouters<typeof aster>

console.log(aster)