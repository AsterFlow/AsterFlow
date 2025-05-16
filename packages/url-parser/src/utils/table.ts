import { AnsiColor, colorize, expressionKeyColorMap } from './colors'

// Remove ANSI color codes to measure string length correctly
export function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u001b\[[0-9;]*m/g, '')
}

// Pad a string to the given width (visual length without ANSI codes)
export function pad(text: string, width: number): string {
  const rawLength = stripAnsi(text).length
  return text + ' '.repeat(Math.max(0, width - rawLength))
}

// Calculate column widths based on headers and rows
export function calculateWidths<T extends Record<string, string>>(rows: T[], headers: Record<keyof T, string>): Record<keyof T, number> {
  const keys = Object.keys(headers) as (keyof T)[]
  const widths = {} as Record<keyof T, number>

  for (const key of keys) {
    // start with header width
    widths[key] = headers[key].length
  }

  for (const row of rows) {
    for (const key of keys) {
      const cell = row[key] || ''
      const length = stripAnsi(cell).length
      if (length > widths[key]) {
        widths[key] = length
      }
    }
  }

  return widths
}

// Render a table given rows and headers
export function renderTable<T extends Record<string, string>>(rows: T[], headers: Record<keyof T, string>): string {
  const widths = calculateWidths(rows, headers)
  const cols = Object.keys(headers) as (keyof T)[]

  // Render header
  const headerLine = cols.map(col => pad(headers[col], widths[col])).join('  ')
  const divider    = stripAnsi(headerLine).split('').map(() => '-').join('')

  // Render rows
  const rowLines = rows.map(row => cols.map(col => pad(row[col] || '-', widths[col])).join('  '))

  return [headerLine, divider, ...rowLines].join('\n')
}

export function colorizePath(input: string, nodes: Array<{ start: number; end: number; expression: number }>): string {
  const chars = input.split('')
  return chars
    .map((ch, idx) => {
      const pos = idx
      const node = nodes.find(n => pos >= n.start && pos < n.end)
      const color = node ? (expressionKeyColorMap[node.expression] ?? AnsiColor.White) : AnsiColor.White
      return colorize(ch, color)
    })
    .join('')
}
