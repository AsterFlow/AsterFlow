import { adapters } from '@asterflow/adapter'
import { Method } from '@asterflow/router'
import fastify from 'fastify'
import { AsterFlow } from './index'
import { z } from 'zod'

/*
type Responder = {
  200: {
    code: string
  }
}

const auth = new Middleware({
  name: 'auth',
  onRun({ schema, next }) {
    console.log(schema)

    return next({
      auth: false
    })
  },
})

const teste = new Middleware({
  name: 'teste',
  onRun({ schema, next }) {
    console.log(schema)

    return next({
      teste: ''
    })
  },
})
  */

const router = new Method({
  path: '/users/:id=number?data=number',
  method: 'post',
  schema: z.object({
    exemplo: z.string()
  }),
  handler({ response, url, schema }) {
    console.log('Schema:', schema.exemplo)
    console.log('Params:', url.getParams())
    console.log('Search Params:', url.getSearchParams())
    return response.send('Teste')
  }
})

const test = new Method({
  path: '/test?data=number',
  method: 'get',
  handler({ response, url, schema }) {
    console.log('Schema:', schema)
    console.log('Params:', url.getParams())
    console.log('Search Params:', url.getSearchParams())
    return response.send('Teste')
  }
})

const server = fastify()

const aster = new AsterFlow({ driver: adapters.fastify })
  // Adiciona rotas individuais
  .controller(router)
  .router({
    basePath: '/:id=number',
    controllers: [test]
  })

console.log(aster.reminist.getRoot('get'))

aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})