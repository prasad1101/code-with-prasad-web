import Papa from 'papaparse'
import { useMemo, useState } from 'react'
import { FIELDS, fakeRows, PRESETS, toSqlInsert, type FieldKey } from '../fakeData'
import { lorem, textStats } from '../logic'
import { ActionButton, Checkbox, Input, Note, Segmented, Select, TextArea, Toolbar } from '../ui'

const TABS = [
  { value: 'lorem', label: 'Lorem ipsum' },
  { value: 'data', label: 'Fake records' },
] as const

const UNITS = [
  { value: 'paragraphs', label: 'Paragraphs' },
  { value: 'sentences', label: 'Sentences' },
  { value: 'words', label: 'Words' },
] as const

const FORMATS = [
  { value: 'json', label: 'JSON' },
  { value: 'csv', label: 'CSV' },
  { value: 'sql', label: 'SQL INSERT' },
] as const

const clampInt = (s: string, lo: number, hi: number, fallback: number) =>
  Math.min(hi, Math.max(lo, Math.floor(Number(s)) || fallback))

function LoremPanel() {
  const [unit, setUnit] = useState<(typeof UNITS)[number]['value']>('paragraphs')
  const [count, setCount] = useState('3')
  const [classic, setClassic] = useState(true)
  const [html, setHtml] = useState(false)
  const [seed, setSeed] = useState(0)

  const n = clampInt(count, 1, unit === 'words' ? 2000 : 100, 3)
  const text = useMemo(() => {
    void seed // regenerate when "Generate again" bumps the seed
    const t = lorem(unit, n, classic)
    return html && unit === 'paragraphs'
      ? t
          .split('\n\n')
          .map((p) => `<p>${p}</p>`)
          .join('\n')
      : t
  }, [unit, n, classic, html, seed])
  const stats = textStats(text)

  return (
    <div className="space-y-5">
      <Toolbar>
        <Segmented label="Unit" value={unit} onChange={setUnit} options={UNITS} />
        <div className="w-28">
          <Input label="How many" type="number" min={1} value={count} onChange={setCount} />
        </div>
      </Toolbar>
      <Toolbar>
        <Checkbox
          label="Start with “Lorem ipsum dolor sit amet”"
          checked={classic}
          onChange={setClassic}
        />
        {unit === 'paragraphs' && (
          <Checkbox label="Wrap in <p> tags" checked={html} onChange={setHtml} />
        )}
        <ActionButton primary onClick={() => setSeed((s) => s + 1)}>
          Generate again
        </ActionButton>
      </Toolbar>
      <TextArea label="Placeholder text" value={text} readOnly rows={14} />
      <Note>
        {stats.words.toLocaleString()} words · {stats.characters.toLocaleString()} characters
      </Note>
    </div>
  )
}

function DataPanel() {
  const [fields, setFields] = useState<FieldKey[]>(PRESETS[0].fields)
  const [count, setCount] = useState('10')
  const [format, setFormat] = useState<(typeof FORMATS)[number]['value']>('json')
  const [table, setTable] = useState('users')
  const [seed, setSeed] = useState(0)

  const n = clampInt(count, 1, 1000, 10)
  const rows = useMemo(() => {
    void seed
    return fakeRows(fields, n)
  }, [fields, n, seed])
  const output = useMemo(() => {
    if (!fields.length) return ''
    if (format === 'json') return JSON.stringify(rows, null, 2)
    if (format === 'csv') return Papa.unparse(rows)
    return toSqlInsert(rows, table.replace(/[^\w.]/g, '') || 'my_table')
  }, [rows, format, table, fields.length])

  const toggle = (f: FieldKey) =>
    setFields((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span className="text-muted self-center text-xs font-semibold tracking-wide uppercase">
          Presets:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => (setFields(p.fields), setTable(p.label.toLowerCase()))}
            className="border-line text-muted hover:border-accent/50 hover:text-fg rounded-full border px-3 py-1 text-xs"
          >
            {p.label}
          </button>
        ))}
      </div>
      <fieldset className="card p-4">
        <legend className="text-muted px-1 text-xs font-semibold tracking-wide uppercase">
          Fields (in order picked)
        </legend>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3 lg:grid-cols-4">
          {(Object.keys(FIELDS) as FieldKey[]).map((f) => (
            <Checkbox
              key={f}
              label={FIELDS[f].label}
              checked={fields.includes(f)}
              onChange={() => toggle(f)}
            />
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-3">
        <Input
          label="Rows (max 1,000)"
          type="number"
          min={1}
          max={1000}
          value={count}
          onChange={setCount}
        />
        <Select label="Format" value={format} onChange={setFormat} options={FORMATS} />
        {format === 'sql' && <Input label="Table name" value={table} onChange={setTable} />}
      </div>
      <ActionButton primary onClick={() => setSeed((s) => s + 1)}>
        Generate again
      </ActionButton>
      {fields.length ? (
        <TextArea label={`${n} records`} value={output} readOnly rows={16} />
      ) : (
        <Note>Pick at least one field.</Note>
      )}
      <Note>
        All data is random and fictional. Emails use the reserved example.com / .org / .net domains.
      </Note>
    </div>
  )
}

export default function DummyData() {
  const [tab, setTab] = useState<(typeof TABS)[number]['value']>('lorem')
  return (
    <div className="space-y-6">
      <Segmented label="Generator" value={tab} onChange={setTab} options={TABS} />
      {tab === 'lorem' ? <LoremPanel /> : <DataPanel />}
    </div>
  )
}
