import { createExpressRequest } from '@asterflow/request'
import { AsterResponse } from '@asterflow/response'
import { type Express, type Response as ExResponse, type Request } from 'express'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'

export default new Adapter({
  runtime: Runtime.Express,
  listen(instance: Express, ...params) {
    instance.all('/{*path}', async (req: Request, res: ExResponse) => {
      if (!this.onRequest) {
        const response = new AsterResponse().notFound({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'The onRequest() function must be defined before the listen() function.'
        }).toResponse()
        
        res.status(response.status)
          .set(Object.fromEntries(response.headers))
          .send(await response.text())
        return
      }
      
      const response = (await this.onRequest(createExpressRequest(req))).toResponse()
      res.status(response.status)
        .set(Object.fromEntries(response.headers))
        .send(await response.text())
    })

    return new Promise<void>((resolve, reject) => {
      const server = instance.listen(...params, () => resolve())

      server.on('error', (err) => reject(err))
    })
  }
})