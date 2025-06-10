import { adapters } from '@asterflow/adapter'
import { Method } from '@asterflow/router'
import fastify from 'fastify'
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
  path: '/users/*',
  method: 'get',
  handler({ response, url }) {
    console.log('Props: ', url.getStaticProps())
    console.log('Params: ', url.getSearchParams())
    return response.send('Teste')
  }
})

console.log(router)

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