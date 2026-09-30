import { useEffect, useMemo, useState } from 'react'
import { formatInZone, parseTimestamp, relativeTime, zonedToDate } from '../logic'
import { ActionButton, Input, Note, ResultRow, Select } from '../ui'

const localZone = Intl.DateTimeFormat().resolvedOptions().timeZone

const ZONES = [
  ...new Set([
    localZone,
    'UTC',
    'Asia/Kolkata',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Berlin',
    'Asia/Dubai',
    'Asia/Singapore',
    'Asia/Tokyo',
    'Australia/Sydney',
  ]),
].map((z) => ({ value: z, label: z === localZone ? `${z} (your zone)` : z }))

/** Offset of `zone` at `date`, e.g. "UTC+05:30". */
function offsetLabel(date: Date, zone: string) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName')?.value
  return name === 'GMT' ? 'UTC+00:00' : (name ?? '').replace('GMT', 'UTC')
}

function useNow() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}

export default function TimestampConverter() {
  const now = useNow()
  const [input, setInput] = useState(() => String(Math.floor(Date.now() / 1000)))
  const [zone, setZone] = useState(localZone)
  const [local, setLocal] = useState(() =>
    formatInZone(new Date(), localZone).replace(' ', 'T').slice(0, 16),
  )

  const parsed = useMemo(() => {
    const s = input.trim()
    if (!s) return null
    const ts = parseTimestamp(s)
    if (ts) return ts
    // Also accept ISO 8601 / RFC 2822 date strings.
    const d = new Date(s)
    return Number.isNaN(d.getTime()) ? ('invalid' as const) : { date: d, unit: 'date string' }
  }, [input])

  const back = useMemo(() => (local ? zonedToDate(local, zone) : null), [local, zone])

  return (
    <div className="space-y-10">
      <div className="card grid gap-3 p-5 sm:grid-cols-3">
        <div>
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">
            Current Unix time
          </p>
          <p className="font-mono text-2xl font-semibold tabular-nums">{Math.floor(now / 1000)}</p>
        </div>
        <div>
          <p className="text-muted text-xs font-semibold tracking-wide uppercase">Milliseconds</p>
          <p className="font-mono text-lg tabular-nums">{now}</p>
        </div>
        <div className="flex items-end">
          <ActionButton onClick={() => setInput(String(Math.floor(Date.now() / 1000)))}>
            Use current time
          </ActionButton>
        </div>
      </div>

      <section className="space-y-4" aria-labelledby="ts-to-date">
        <h2 id="ts-to-date" className="text-xl font-semibold">
          Timestamp → date
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Unix timestamp or date string"
            value={input}
            onChange={setInput}
            invalid={parsed === 'invalid'}
          />
          <Select label="Show in time zone" value={zone} onChange={setZone} options={ZONES} />
        </div>
        {parsed === 'invalid' && (
          <Note tone="error">✗ Not a timestamp or a date the browser understands.</Note>
        )}
        {parsed && parsed !== 'invalid' && (
          <div className="space-y-2">
            <Note>
              Interpreted as <strong>{parsed.unit}</strong> · {relativeTime(parsed.date, now)}
            </Note>
            <ResultRow
              label={zone === 'UTC' ? 'UTC' : 'In zone'}
              value={`${formatInZone(parsed.date, zone)} (${offsetLabel(parsed.date, zone)})`}
            />
            <ResultRow label="ISO 8601 UTC" value={parsed.date.toISOString()} />
            <ResultRow label="RFC 2822" value={parsed.date.toUTCString()} />
            <ResultRow label="Seconds" value={String(Math.floor(parsed.date.getTime() / 1000))} />
            <ResultRow label="Milliseconds" value={String(parsed.date.getTime())} />
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="date-to-ts">
        <h2 id="date-to-ts" className="text-xl font-semibold">
          Date → timestamp
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={`Date & time in ${zone}`}
            type="datetime-local"
            value={local}
            onChange={setLocal}
          />
          <Select label="Time zone" value={zone} onChange={setZone} options={ZONES} />
        </div>
        {back && (
          <div className="space-y-2">
            <ResultRow label="Seconds" value={String(Math.floor(back.getTime() / 1000))} />
            <ResultRow label="Milliseconds" value={String(back.getTime())} />
            <ResultRow label="ISO 8601 UTC" value={back.toISOString()} />
          </div>
        )}
      </section>
    </div>
  )
}
