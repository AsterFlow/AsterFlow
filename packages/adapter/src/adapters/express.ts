import { type Express, type Response as ExResponse, type Request } from 'express'
import { Response } from '@asterflow/router'
import { Adapter } from '../controllers/Adapter'
import { Runtime } from '../types/adapter'
import { ExpressRequest } from '@asterflow/request'

export default new Adapter({
  runtime: Runtime.Express,
  listen(instance: Express, ...params) {
    instance.all('/{*path}', async (req: Request, res: ExResponse) => {
      if (!this.onRequest) {
        const response = new Response().notFound({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'The onRequest() function must be defined before the listen() function.'
        }).toResponse()
        
        res.status(response.status)
          .set(Object.fromEntries(response.headers))
          .send(await response.text())
        return
      }
      
      const response = (await this.onRequest(new ExpressRequest(req))).toResponse()
      res.status(response.status)
        .set(Object.fromEntries(response.headers))
        .send(await response.text())
    })

    instance.listen(...params)
    return instance
  },
})
