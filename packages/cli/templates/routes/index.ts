import { Method } from '@asterflow/router'

export default new Method(Method.GET, {
  handler({ response }) {
    return response.success({ message: 'Hello from AsterFlow!' })
  }
})
