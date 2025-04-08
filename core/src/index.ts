import { drivers } from 'driver'
import fastify from 'fastify'
import { Method } from 'router'
import { AsterFlow } from './controllers/Asterflow'
import { createServer } from 'http'

type Res<TData = unknown> = {
  200: {
    gasd: string
  },
  404: {
    asdasd: string,
    data: TData
  }
}

const aster = new AsterFlow({ driver: drivers.express })
const server = fastify()

const method = new Method({
  method: 'get',
  path: '//teste',
  handle:({ response, request }) => {
    return response.notFound({
      asdasd: '',
      data: ''
    })
  }
})

const out = aster
  .controller(method)
  .router({
    basePath: '/v1/',
    controllers: [method]
  })
const data = out.routers.get('/teste')

aster.listen({ port: 4000 })

type ListRouters<T> = T extends AsterFlow<any, infer Routers> ? Routers : never
type Routes = ListRouters<typeof aster>
