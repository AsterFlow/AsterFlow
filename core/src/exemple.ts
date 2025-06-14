import { adapters } from '@asterflow/adapter'
import { Plugin } from '@asterflow/plugin'
import fastify from 'fastify'
import { AsterFlow } from './index'

const server = fastify()
const plugin = Plugin
  .create({ name: 'auth' })
  .config({ path: process.cwd() })
  .derive('auth', (ctx) => ({ path: ctx.path }))
  .decorate('token', '1234')
  .extends((app) => {
    return {
      getCurrentUser: (id: string) => ({ id, name: 'John Doe' })
    }
  })
  .on('afterInitialize', (app, context) => console.log(context.auth))
  .on('afterInitialize', (app, context) => console.log(context.auth))
  .on('beforeInitialize', () => console.log('before'))
  .on('onRequest', () => console.log('request'))
  .on('onResponse', () => console.log('response'))

const aster = new AsterFlow({ driver: adapters.fastify })
  .use(plugin, { path: '/' })
  .method({ 
    path: '/',
    method: 'get',
    handler({ response, instance }) {
      console.log(instance)
      return response.send('Teste')
    }
  })

await aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('Server listening!')
})