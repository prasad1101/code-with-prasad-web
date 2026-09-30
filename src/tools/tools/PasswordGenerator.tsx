import { useMemo, useState } from 'react'
import {
  CHARSETS,
  generatePassphrase,
  generatePassword,
  PASSPHRASE_POOL,
  strength,
  strengthOf,
  type Charset,
} from '../logic'
import { ActionButton, Checkbox, CopyButton, Input, Note, Segmented, Toolbar } from '../ui'

const MODES = [
  { value: 'password', label: 'Password' },
  { value: 'passphrase', label: 'Passphrase' },
] as const

const SET_LABELS: Record<Charset, string> = {
  lower: 'a–z',
  upper: 'A–Z',
  digits: '0–9',
  symbols: '!@#$…',
}

const BAR: Record<string, string> = {
  Weak: 'w-1/4 bg-red-500',
  Fair: 'w-2/4 bg-amber-500',
  Strong: 'w-3/4 bg-emerald-500',
  'Very strong': 'w-full bg-emerald-500',
}

export default function PasswordGenerator() {
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('password')
  const [length, setLength] = useState(20)
  const [sets, setSets] = useState<Charset[]>(['lower', 'upper', 'digits', 'symbols'])
  const [noAmbiguous, setNoAmbiguous] = useState(false)
  const [wordsCount, setWordsCount] = useState(5)
  const [sep, setSep] = useState('-')
  const [capWords, setCapWords] = useState(true)
  const [addNum, setAddNum] = useState(true)
  const [seed, setSeed] = useState(0)

  const value = useMemo(() => {
    void seed // "Generate another" bumps the seed
    return mode === 'password'
      ? generatePassword(length, sets, noAmbiguous)
      : generatePassphrase(wordsCount, sep, capWords, addNum)
  }, [mode, length, sets, noAmbiguous, wordsCount, sep, capWords, addNum, seed])

  const pool = sets.reduce((n, s) => n + CHARSETS[s].length, 0)
  const s =
    mode === 'password'
      ? strength(length, pool)
      : strengthOf(wordsCount * Math.log2(PASSPHRASE_POOL) + (addNum ? Math.log2(100) : 0))

  const toggle = (c: Charset) =>
    setSets((cur) =>
      cur.includes(c) ? (cur.length > 1 ? cur.filter((x) => x !== c) : cur) : [...cur, c],
    )

  return (
    <div className="space-y-6">
      <Segmented label="Type" value={mode} onChange={setMode} options={MODES} />

      <div className="card space-y-4 p-5">
        <div className="flex items-start gap-3">
          <output
            className="min-w-0 flex-1 font-mono text-lg break-all sm:text-xl"
            aria-live="polite"
          >
            {value}
          </output>
          <CopyButton value={value} />
        </div>
        <div>
          <div className="bg-surface-2 h-2 overflow-hidden rounded-full">
            <div className={`h-full rounded-full transition-all ${BAR[s.label]}`} />
          </div>
          <p className="text-muted mt-2 text-sm">
            {s.label} · about {s.bits} bits of entropy
          </p>
        </div>
        <ActionButton primary onClick={() => setSeed((x) => x + 1)}>
          Generate another
        </ActionButton>
      </div>

      {mode === 'password' ? (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-muted text-xs font-semibold tracking-wide uppercase">
              Length: {length}
            </span>
            <input
              type="range"
              min={6}
              max={128}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="w-full accent-[var(--c-accent)]"
            />
          </label>
          <Toolbar>
            {(Object.keys(CHARSETS) as Charset[]).map((c) => (
              <Checkbox
                key={c}
                label={SET_LABELS[c]}
                checked={sets.includes(c)}
                onChange={() => toggle(c)}
              />
            ))}
            <Checkbox
              label="Avoid look-alikes (0 O l 1 I)"
              checked={noAmbiguous}
              onChange={setNoAmbiguous}
            />
          </Toolbar>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-muted text-xs font-semibold tracking-wide uppercase">
              Words: {wordsCount}
            </span>
            <input
              type="range"
              min={3}
              max={10}
              value={wordsCount}
              onChange={(e) => setWordsCount(Number(e.target.value))}
              className="w-full accent-[var(--c-accent)]"
            />
          </label>
          <Toolbar>
            <div className="w-32">
              <Input label="Separator" value={sep} onChange={setSep} />
            </div>
            <Checkbox label="Capitalise words" checked={capWords} onChange={setCapWords} />
            <Checkbox label="Add a number" checked={addNum} onChange={setAddNum} />
          </Toolbar>
        </div>
      )}
      <Note>
        Generated with your browser&apos;s cryptographically secure random generator. Nothing is
        sent or stored — use a password manager to keep it.
      </Note>
    </div>
  )
}
