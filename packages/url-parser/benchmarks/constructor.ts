import benchmark from 'cronometro'
import { Analyze } from '../src/index'
import { InternalExpression } from '../src/types/node'

const input = 'http://localhost:3000/users/:id=number?a=array&b#c'

await benchmark({
  async import () {
    return await import('../src/index')
  },
  analyze () {
    return new Analyze(input)
  },
  getBuffer () {
    return new Analyze(input).getBuffer()
  },
  getParams () {
    return new Analyze(input).getParams()
  },
  getSearchParams () {
    return new Analyze(input).getSearchParams()
  },
  getFragment () {
    return new Analyze(input).getFragment()
  },
  getHostname () {
    return new Analyze(input).getHostname()
  },
  getPort () {
    return new Analyze(input).getPort()
  },
  getProtocol () {
    return new Analyze(input).getProtocol()
  },
  getContent () {
    const analyze = new Analyze(input)
    return analyze.getContent(analyze.nodes[5]!)
  },
  getNode () {
    const analyze = new Analyze(input)
    return analyze.getNode(5)
  },
  getNodeByType () {
    const analyze = new Analyze(input)
    return analyze.getNodeByType(InternalExpression.Parameter)
  },
  getType () {
    const analyze = new Analyze(input)
    return analyze.getType(5)
  },
  getValue () {
    const analyze = new Analyze(input)
    return analyze.getValue(5)
  },
}, {
  warmup: true,
  iterations: 10_000,
})