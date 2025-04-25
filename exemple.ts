import { AsterFlow } from '@asterflow/core'
import { drivers } from '@asterflow/driver'
import { Method, Middleware, Router } from '@asterflow/router'
import { c } from '@caeljs/config'
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

const router = new Router({
  path: '/',
  use: [auth],
  methods: {
    get({ response, middleware }) {
      console.log(middleware.auth) // false
      return response.send({})
    }
  }
})

const method = new Method({
  path: '/',
  schema: c.object({
    name: c.string()
  }),
  use: [auth],
  method: 'post',
  handler: ({ response, schema, middleware }) => {
    if (middleware.auth) return response.status(400).send(`hello ${schema.name}`)
    return response.status(200).send(`hello ${schema.name}`)
  }
})

const router = new Router({
  name: 'Exemplo',
  path: '/exemple',
  methods: {
    get({ response }) {
      return response.success('hello')
    }
  }
})

const server = fastify()

const aster = new AsterFlow({ driver: drivers.fastify })
  // Adiciona rotas individuais
  .controller(router)
  // Adiciona varias rotas
  .router({
    basePath: '/v1',
    controllers: [method]
  })

// aster.routers.get('/') // Method...

aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }
  console.log('Server listening!')
})