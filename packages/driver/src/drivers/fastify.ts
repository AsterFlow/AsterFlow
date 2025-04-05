import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { Response } from "router"
import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"

type HeadersInit = string[][] | Record<string, string | ReadonlyArray<string>> | Headers

export default new Driver({
  runtime: Runtime.Fastify,
  listen(instance: FastifyInstance, params) {
    instance.all('*', async (request: FastifyRequest) => {
      const { raw: nodeReq, headers, method } = request
      const host = headers.host!
      const url = new URL(nodeReq.url || '', `http://${host}`)

      const fetchReq = new Request(url.toString(), {
        method,
        headers: headers as HeadersInit,
        body: ['GET', 'HEAD'].includes(method!) ? undefined : nodeReq,
      })

      return Driver.onRequest(fetchReq, new Response())
    })

    // 6) inicia o servidor
    instance.listen(params)
    return instance
  },
})
