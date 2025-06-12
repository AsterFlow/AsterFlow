import { adapters } from '@asterflow/adapter'
import { createRouter, Method } from '@asterflow/router'
import fastify from 'fastify'
import { z } from 'zod'
import { AsterFlow } from './index'

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
  handler({ response, url }) {
    console.log('Params:', url.getParams())
    console.log('Search Params:', url.getSearchParams())
    return response.send('Teste')
  }
})


const test2 = createRouter<{ 200: string }>()({
  path: '/test',
  schema: {
    get: z.object({})
  },
  methods: {
    get({ response }) {
      return response.success('')
    }
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

const route = aster.reminist.find('get', '/:id/test')

// Adicione uma verificação para ter certeza de que a rota foi encontrada
if (route && route.node && route.node.store) {
  // Acesse a propriedade .store para ver o seu RouteEntry
  console.log(route.node.store) 
} else {
  console.log('Rota não foi encontrada.')
}
aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})