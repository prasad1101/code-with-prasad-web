import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { FiCheck, FiCopy } from 'react-icons/fi'

/*
 * Building blocks shared by every tool so they look and behave the same:
 * labelled text areas, read-only outputs with a copy button, segmented toggles, notes.
 */

const fieldCls =
  'border-line bg-surface-2/60 text-fg placeholder:text-muted/70 focus:border-accent/60 w-full rounded-xl border px-3 py-2.5 font-mono text-sm [font-variant-ligatures:none] outline-none transition-colors'

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked (e.g. insecure context) — nothing useful to do */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="border-line text-muted hover:border-accent/60 hover:text-fg inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40"
    >
      {copied ? <FiCheck aria-hidden="true" /> : <FiCopy aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : label}</span>
    </button>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 10,
  readOnly,
  actions,
  invalid,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  rows?: number
  readOnly?: boolean
  actions?: ReactNode
  invalid?: boolean
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <div className="flex min-h-7 items-center justify-between gap-2">
        <label htmlFor={id} className="text-muted text-xs font-semibold tracking-wide uppercase">
          {label}
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {actions}
          {readOnly && <CopyButton value={value} />}
        </div>
      </div>
      <textarea
        id={id}
        value={value}
        rows={rows}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange?.(e.target.value)}
        className={`${fieldCls} resize-y leading-relaxed ${invalid ? 'border-red-500/60' : ''} ${
          readOnly ? 'bg-surface' : ''
        }`}
      />
    </div>
  )
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  mono = true,
  invalid,
  ...rest
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  mono?: boolean
  invalid?: boolean
  min?: number
  max?: number
  step?: number
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={`${fieldCls} ${mono ? '' : 'font-sans'} ${invalid ? 'border-red-500/60' : ''}`}
        {...rest}
      />
    </div>
  )
}

export function Select<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label htmlFor={id} className="text-muted text-xs font-semibold tracking-wide uppercase">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${fieldCls} font-sans`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

/** Segmented control for choosing a mode ("Encode" / "Decode", "2 spaces" / "Tab" …). */
export function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: readonly { value: T; label: string }[]
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="border-line bg-surface-2/60 inline-flex flex-wrap gap-1 rounded-xl border p-1"
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              active ? 'bg-accent/15 text-fg ring-accent/50 ring-1' : 'text-muted hover:text-fg'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="text-muted hover:text-fg inline-flex cursor-pointer items-center gap-2 text-sm select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-[var(--c-accent)]"
      />
      {label}
    </label>
  )
}

export function ActionButton({
  children,
  onClick,
  primary,
}: {
  children: ReactNode
  onClick: () => void
  primary?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-[0.98] ${
        primary
          ? 'bg-gradient-accent text-white shadow-[0_8px_30px_-12px_var(--c-glow)]'
          : 'border-line text-fg hover:border-accent/60 border'
      }`}
    >
      {children}
    </button>
  )
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>
}

/** Inline status line — errors in red, everything else muted. */
export function Note({
  children,
  tone = 'muted',
}: {
  children: ReactNode
  tone?: 'muted' | 'error' | 'ok'
}) {
  const color =
    tone === 'error' ? 'text-red-500' : tone === 'ok' ? 'text-emerald-500' : 'text-muted'
  return (
    <p role={tone === 'error' ? 'alert' : undefined} className={`text-sm ${color}`}>
      {children}
    </p>
  )
}

/** A labelled read-only value with a copy button, for key/value style results. */
export function ResultRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-line bg-surface flex min-w-0 items-center gap-3 rounded-xl border px-3 py-2">
      <span className="text-muted w-20 shrink-0 text-xs font-semibold tracking-wide uppercase sm:w-28">
        {label}
      </span>
      <code
        className="min-w-0 flex-1 font-mono text-sm break-all [font-variant-ligatures:none] sm:truncate"
        title={value}
      >
        {value || '—'}
      </code>
      <CopyButton value={value} />
    </div>
  )
}

export const TwoCol = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-5 lg:grid-cols-2">{children}</div>
)
