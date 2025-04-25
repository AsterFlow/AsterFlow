import { type Express, type Response as ExResponse, type Request } from 'express'
import { Response } from '@asterflow/router'
import { Driver } from '../controllers/Driver'
import { Runtime } from '../types/driver'

export default new Driver({
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
      
      const response = (await this.onRequest(req, new Response())).toResponse()
      res.status(response.status)
        .set(Object.fromEntries(response.headers))
        .send(await response.text())
    })

    instance.listen(...params)
    return instance
  },
})
