import cronstrue from 'cronstrue'
import { useMemo, useState } from 'react'
import { CRON_MACROS, nextCronRuns, parseCron, relativeTime } from '../logic'
import { Checkbox, Input, Note, Toolbar } from '../ui'

const PRESETS: [string, string][] = [
  ['*/5 * * * *', 'Every 5 minutes'],
  ['0 * * * *', 'Hourly'],
  ['0 9 * * 1-5', 'Weekdays at 9 AM'],
  ['30 2 * * *', 'Daily at 2:30 AM'],
  ['0 0 * * 0', 'Sundays at midnight'],
  ['0 0 1 * *', 'First of the month'],
  ['0 6,18 * * *', '6 AM and 6 PM'],
  ['0 0 1 1 *', 'Every New Year'],
]

const FIELDS: [string, string, string][] = [
  ['Minute', '0–59', '*/15 = every 15 minutes'],
  ['Hour', '0–23', '9-17 = 9 AM to 5 PM'],
  ['Day of month', '1–31', '1,15 = 1st and 15th'],
  ['Month', '1–12 or JAN–DEC', '*/3 = every quarter'],
  ['Day of week', '0–6 or SUN–SAT (7 = Sun)', 'MON-FRI = weekdays'],
]

export default function CronExplainer() {
  const [expr, setExpr] = useState('0 9 * * 1-5')
  const [utc, setUtc] = useState(false)
  const [h24, setH24] = useState(false)

  const result = useMemo(() => {
    const e = expr.trim()
    if (!e) return null
    try {
      const fields = e.startsWith('@') ? CRON_MACROS[e.toLowerCase()] : e
      if (!fields) throw new Error(`Unknown macro. Try ${Object.keys(CRON_MACROS).join(', ')}`)
      const text = cronstrue.toString(fields, { use24HourTimeFormat: h24, verbose: true })
      const runs = nextCronRuns(parseCron(fields), new Date(), 8, utc)
      return { ok: true as const, text, runs, parts: fields.split(/\s+/) }
    } catch (err) {
      return {
        ok: false as const,
        error: String(err instanceof Error ? err.message : err).replace(/^Error:\s*/, ''),
      }
    }
  }, [expr, utc, h24])

  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: !h24,
      timeZone: utc ? 'UTC' : undefined,
    })

  return (
    <div className="space-y-6">
      <Input
        label="Cron expression (minute hour day month weekday)"
        value={expr}
        onChange={setExpr}
        invalid={result?.ok === false}
      />
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(([e, label]) => (
          <button
            key={e}
            type="button"
            onClick={() => setExpr(e)}
            className="border-line text-muted hover:border-accent/50 hover:text-fg rounded-full border px-3 py-1 text-xs"
          >
            {label}
          </button>
        ))}
      </div>
      {result?.ok === false && <Note tone="error">✗ {result.error}</Note>}
      {result?.ok && (
        <>
          <div className="card p-5">
            <p className="text-muted text-xs font-semibold tracking-wide uppercase">
              In plain English
            </p>
            <p className="font-display mt-1 text-2xl font-semibold" aria-live="polite">
              “{result.text}”
            </p>
            <div className="mt-4 flex flex-wrap gap-2 font-mono text-sm">
              {result.parts.map((p, i) => (
                <span
                  key={i}
                  className="border-line bg-surface-2 rounded-lg border px-2.5 py-1"
                  title={FIELDS[i][0]}
                >
                  <span className="text-accent-2">{p}</span>{' '}
                  <span className="text-muted font-sans text-xs">{FIELDS[i][0].toLowerCase()}</span>
                </span>
              ))}
            </div>
          </div>
          <Toolbar>
            <Checkbox label="Show times in UTC" checked={utc} onChange={setUtc} />
            <Checkbox label="24-hour clock" checked={h24} onChange={setH24} />
          </Toolbar>
          <div>
            <h2 className="mb-3 text-lg font-semibold">Next runs</h2>
            {result.runs.length ? (
              <ol className="grid gap-2 sm:grid-cols-2">
                {result.runs.map((d) => (
                  <li
                    key={d.getTime()}
                    className="border-line bg-surface flex justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
                  >
                    <span className="font-mono">{fmt(d)}</span>
                    <span className="text-muted">{relativeTime(d)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <Note>This schedule never runs in the next few years (e.g. 31 February).</Note>
            )}
          </div>
        </>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <caption className="text-muted px-4 pt-3 text-left text-xs font-semibold tracking-wide uppercase">
            Field reference — use * for any, a,b for lists, a-b for ranges, */n for steps
          </caption>
          <thead>
            <tr className="border-line border-b">
              <th className="px-4 py-2">Field</th>
              <th className="px-4 py-2">Allowed</th>
              <th className="px-4 py-2">Example</th>
            </tr>
          </thead>
          <tbody>
            {FIELDS.map(([f, allowed, ex]) => (
              <tr key={f} className="border-line border-b last:border-0">
                <td className="px-4 py-2 font-medium">{f}</td>
                <td className="text-muted px-4 py-2 font-mono">{allowed}</td>
                <td className="text-muted px-4 py-2 font-mono">{ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Note>
        Uses standard 5-field Unix/Vixie cron (Linux crontab, Kubernetes CronJobs, GitHub Actions,
        Airflow). When both day-of-month and day-of-week are set, a run happens if <em>either</em>{' '}
        matches.
      </Note>
    </div>
  )
}
