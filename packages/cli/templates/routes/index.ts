import { Method } from '@asterflow/router'

export default new Method({
  method: 'get',
  handler({ response }) {
    return response.success({ message: 'Hello from AsterFlow!' })
  }
})
