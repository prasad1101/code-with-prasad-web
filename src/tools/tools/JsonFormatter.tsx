import { useMemo, useState } from 'react'
import { parseJson, sortKeys } from '../logic'
import { ActionButton, Checkbox, Note, Segmented, TextArea, Toolbar, TwoCol } from '../ui'

const SAMPLE = `{"name":"Code with Prasad","tags":["react","angular","node"],"author":{"name":"Prasad","experienceYears":8},"published":true,"rating":4.9,"sponsor":null}`

const INDENTS = [
  { value: '2', label: '2 spaces' },
  { value: '4', label: '4 spaces' },
  { value: 'tab', label: 'Tab' },
  { value: 'min', label: 'Minify' },
] as const

export default function JsonFormatter() {
  const [input, setInput] = useState(SAMPLE)
  const [indent, setIndent] = useState<(typeof INDENTS)[number]['value']>('2')
  const [sort, setSort] = useState(false)

  const result = useMemo(() => {
    if (!input.trim()) return null
    const r = parseJson(input)
    if (!r.ok) return r
    const value = sort ? sortKeys(r.value) : r.value
    const space = indent === 'min' ? undefined : indent === 'tab' ? '\t' : Number(indent)
    return { ok: true as const, output: JSON.stringify(value, null, space) }
  }, [input, indent, sort])

  const output = result?.ok ? result.output : ''

  return (
    <div className="space-y-5">
      <Toolbar>
        <Segmented label="Indentation" value={indent} onChange={setIndent} options={INDENTS} />
        <Checkbox label="Sort keys A→Z" checked={sort} onChange={setSort} />
        <ActionButton onClick={() => result?.ok && setInput(result.output)}>
          Replace input with result
        </ActionButton>
        <ActionButton onClick={() => setInput('')}>Clear</ActionButton>
      </Toolbar>
      <TwoCol>
        <TextArea
          label="Input JSON"
          value={input}
          onChange={setInput}
          rows={18}
          invalid={result?.ok === false}
          placeholder='Paste JSON here, e.g. {"hello": "world"}'
        />
        <TextArea label="Result" value={output} readOnly rows={18} />
      </TwoCol>
      {result === null ? (
        <Note>Paste some JSON to get started.</Note>
      ) : result.ok ? (
        <Note tone="ok">
          ✓ Valid JSON · {new TextEncoder().encode(result.output).length.toLocaleString()} bytes
          formatted
        </Note>
      ) : (
        <Note tone="error">✗ {result.error}</Note>
      )}
    </div>
  )
}
