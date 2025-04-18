import { Driver, drivers } from 'driver'
import fastify from 'fastify'
import { Method } from 'router'
import { AsterFlow } from './controllers/Asterflow'
import { z } from 'zod'
import { c } from '@caeljs/config'

type Res<TData = unknown> = {
  200: {
    gasd: string
  },
  404: {
    data: TData
  }
}

const aster = new AsterFlow({ driver: drivers.fastify })
const server = fastify()

const method = new Method({
  method: 'get',
  path: '/teste',
  schema: c.object({
      valor: c.string()
  }),
  handler: ({ response, request, schema }) => {
    return response.notFound({
      data: "world"
    })
  }
})

aster
  .controller(method)
  .router({
    basePath: '/v1/',
    controllers: [method]
  })

aster.listen(server, { port: 2000 })