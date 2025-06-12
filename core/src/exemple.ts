import { adapters } from '@asterflow/adapter'
import { Plugin } from '@asterflow/plugin'
import { Method } from '@asterflow/router'
import fastify from 'fastify'
import { AsterFlow } from './index'

const router = new Method({
  path: '/',
  method: 'get',
  handler({ response, url }) {
    console.log('Params:', url.getParams())
    console.log('Search Params:', url.getSearchParams())
    // console.log(plugins)
    return response.send('Teste')
  }
})

const server = fastify()

const plugin = Plugin
  .create({ name: 'auth' })
  .withConfig({ path: process.cwd() })
  .derive('auth', (ctx) => ({ path: ctx.path }))
  .decorate('token', '1234')
  .on('afterInitialize', () => console.log('after'))
  .on('beforeInitialize', () => console.log('before'))
  .on('onRequest', () => console.log('request'))
  .on('onResponse', () => console.log('response'))

const aster = new AsterFlow({ driver: adapters.fastify })
  .controller(router)
  .use(plugin, { path: 'test' })

console.log(JSON.stringify(plugin, null, 2))

await aster.listen(server, { port: 3333 }, (err) => {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  console.log('Server listening!')
})