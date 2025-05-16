import { adapters } from '@asterflow/adapter'
import { Middleware, Router } from '@asterflow/router'
import { AsterFlow } from './index'
import fastify from 'fastify'

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

const router = new Router({
  path: '/:id=number?teste#session',
  methods: {
    get({ response, url }) {
      console.log(url.getParams())
      console.log(url.getSearchParams())
      console.log(url.display())
      return response.send('Teste')
    }
  }
})

const server = fastify()

const aster = new AsterFlow({ driver: adapters.fastify })
  // Adiciona rotas individuais
  .controller(router)

aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})