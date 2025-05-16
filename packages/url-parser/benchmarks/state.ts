import benchmark from 'cronometro'
import { Analyze } from '../src'

const input = 'frappucino=muffin&goat=scone&pond=moose&foo=bar&foo=baz'
const analyze = new Analyze(input)

await benchmark({
  state_getBuffer () {
    return analyze.getBuffer()
  },
  state_getParams () {
    return analyze.getParams()
  },
  state_getSearchParams () {
    return analyze.getSearchParams()
  }
}, { warmup: true })