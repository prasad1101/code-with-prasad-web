import { useMemo, useState } from 'react'
import { inspectUuid, uuidV7 } from '../logic'
import { ActionButton, Checkbox, Input, Note, Segmented, TextArea, Toolbar } from '../ui'

const VERSIONS = [
  { value: 'v4', label: 'v4 (random)' },
  { value: 'v7', label: 'v7 (time-ordered)' },
] as const

type Version = (typeof VERSIONS)[number]['value']

function make(version: Version, count: number, upper: boolean, hyphens: boolean, braces: boolean) {
  return Array.from({ length: count }, () => {
    let id = version === 'v4' ? crypto.randomUUID() : uuidV7()
    if (!hyphens) id = id.replace(/-/g, '')
    if (upper) id = id.toUpperCase()
    return braces ? `{${id}}` : id
  }).join('\n')
}

export default function UuidGenerator() {
  const [version, setVersion] = useState<Version>('v4')
  const [count, setCount] = useState('5')
  const [upper, setUpper] = useState(false)
  const [hyphens, setHyphens] = useState(true)
  const [braces, setBraces] = useState(false)
  const [seed, setSeed] = useState(0)
  const [inspect, setInspect] = useState('')

  const n = Math.min(1000, Math.max(1, Math.floor(Number(count)) || 1))
  const output = useMemo(() => {
    void seed // "Generate again" bumps the seed
    return make(version, n, upper, hyphens, braces)
  }, [version, n, upper, hyphens, braces, seed])

  const info = inspect.trim() ? inspectUuid(inspect) : undefined

  return (
    <div className="space-y-5">
      <Toolbar>
        <Segmented label="Version" value={version} onChange={setVersion} options={VERSIONS} />
        <div className="w-28">
          <Input
            label="How many"
            type="number"
            min={1}
            max={1000}
            value={count}
            onChange={setCount}
          />
        </div>
      </Toolbar>
      <Toolbar>
        <Checkbox label="Hyphens" checked={hyphens} onChange={setHyphens} />
        <Checkbox label="Uppercase" checked={upper} onChange={setUpper} />
        <Checkbox label="Braces { }" checked={braces} onChange={setBraces} />
        <ActionButton primary onClick={() => setSeed((x) => x + 1)}>
          Generate again
        </ActionButton>
      </Toolbar>
      <TextArea
        label={`${n} UUID${n > 1 ? 's' : ''}`}
        value={output}
        readOnly
        rows={Math.min(14, n + 1)}
      />
      <Note>
        v4 is fully random. v7 starts with a millisecond timestamp, so new ids sort after old ones —
        better for database primary keys and indexes.
      </Note>

      <div className="border-line space-y-3 border-t pt-6">
        <Input
          label="Inspect a UUID"
          value={inspect}
          onChange={setInspect}
          placeholder="Paste a UUID"
          invalid={info === null}
        />
        {info === null && (
          <Note tone="error">✗ Not a valid UUID (expected 8-4-4-4-12 hex digits).</Note>
        )}
        {info && (
          <Note tone="ok">
            ✓ Version {info.version} UUID
            {info.time &&
              ` · created ${info.time.toISOString()} (${info.time.toLocaleString()} your time)`}
          </Note>
        )}
      </div>
    </div>
  )
}
