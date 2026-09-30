import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml'
import { flatten, parseJson } from '../logic'
import { Checkbox, Note, Select, TextArea, TwoCol } from '../ui'

type Format = 'json' | 'csv' | 'yaml'

const FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'yaml', label: 'YAML' },
] as const

const SAMPLES: Record<Format, string> = {
  json: `[
  { "id": 1, "name": "Aarav", "city": "Pune", "skills": ["React", "Node.js"], "address": { "zip": "411001" } },
  { "id": 2, "name": "Meera", "city": "Bengaluru", "skills": ["Python", "SQL"], "address": { "zip": "560001" } }
]`,
  csv: `id,name,city,active
1,Aarav,Pune,true
2,Meera,"Bengaluru, KA",false`,
  yaml: `service: orders-api
replicas: 3
env:
  - name: NODE_ENV
    value: production
  - name: PORT
    value: "8080"`,
}

function read(text: string, from: Format, dynamicTyping: boolean): unknown {
  if (from === 'json') {
    const r = parseJson(text)
    if (!r.ok) throw new Error(r.error)
    return r.value
  }
  if (from === 'yaml') return parseYaml(text)
  const res = Papa.parse<Record<string, unknown>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    dynamicTyping,
  })
  const fatal = res.errors.find((e) => e.type !== 'Delimiter')
  if (fatal) throw new Error(`CSV row ${(fatal.row ?? 0) + 2}: ${fatal.message}`)
  return res.data
}

function write(value: unknown, to: Format, delimiter: string): string {
  if (to === 'json') return JSON.stringify(value, null, 2)
  if (to === 'yaml') return stringifyYaml(value)
  const rows = Array.isArray(value) ? value : [value]
  if (rows.some((r) => !r || typeof r !== 'object' || Array.isArray(r))) {
    throw new Error('CSV needs an object or an array of objects (one object per row).')
  }
  const flat = rows.map((r) => flatten(r))
  const columns = [...new Set(flat.flatMap((r) => Object.keys(r)))]
  return Papa.unparse(
    { fields: columns, data: flat.map((r) => columns.map((c) => r[c] ?? '')) },
    { delimiter },
  )
}

export default function DataConverter() {
  const [from, setFrom] = useState<Format>('json')
  const [to, setTo] = useState<Format>('csv')
  const [input, setInput] = useState(SAMPLES.json)
  const [typed, setTyped] = useState(true)
  const [delimiter, setDelimiter] = useState(',')

  const result = useMemo(() => {
    if (!input.trim()) return { output: '', error: '' }
    try {
      return { output: write(read(input, from, typed), to, delimiter), error: '' }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) }
    }
  }, [input, from, to, typed, delimiter])

  const changeFrom = (f: Format) => {
    // Swap directions when picking the current target, and load a sample for the new format.
    if (f === to) setTo(from)
    setFrom(f)
    setInput(SAMPLES[f])
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-4">
        <Select label="From" value={from} onChange={changeFrom} options={FORMATS} />
        <Select
          label="To"
          value={to}
          onChange={(t) => (t === from ? changeFrom(to) : setTo(t))}
          options={FORMATS}
        />
        {to === 'csv' && (
          <Select
            label="CSV delimiter"
            value={delimiter}
            onChange={setDelimiter}
            options={[
              { value: ',', label: 'Comma (,)' },
              { value: ';', label: 'Semicolon (;)' },
              { value: '\t', label: 'Tab' },
              { value: '|', label: 'Pipe (|)' },
            ]}
          />
        )}
        {from === 'csv' && (
          <div className="flex items-end pb-2.5">
            <Checkbox label="Detect numbers & booleans" checked={typed} onChange={setTyped} />
          </div>
        )}
      </div>
      <TwoCol>
        <TextArea
          label={`Input (${from.toUpperCase()})`}
          value={input}
          onChange={setInput}
          rows={16}
          invalid={!!result.error}
        />
        <TextArea label={`Output (${to.toUpperCase()})`} value={result.output} readOnly rows={16} />
      </TwoCol>
      {result.error ? (
        <Note tone="error">✗ {result.error}</Note>
      ) : (
        to === 'csv' && (
          <Note>
            Nested objects become dotted columns (address.zip); arrays are kept as JSON text.
          </Note>
        )
      )}
    </div>
  )
}
