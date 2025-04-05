import { Response } from "router"
import { Driver } from "../controllers/Driver"
import { Runtime } from "../types/driver"
import { createServer } from 'http'
type HeadersInit = string[][] | Record<string, string | ReadonlyArray<string>> | Headers;

export default new Driver({
  runtime: Runtime.Node,
  listen(params) {
    return createServer((request) => {
      const { method = 'GET', headers } = request;
      // 1) monta a URL completa
      const host = headers.host!;
      const url = new URL(request.url || '', `http://${host}`);  
    
      // 2) cria o Request do Fetch
      const fetchReq = new Request(url.toString(), {
        method,
        headers: headers as HeadersInit,
        // só define body em métodos que podem ter payload
        body: ['GET','HEAD'].includes(method) ? undefined : request,
      });

      return Driver.onRequest(fetchReq, new Response())
    }).listen(params)
  },
})
