import { useMemo, useState } from 'react'
import { BASES, groupDigits, parseBigInt } from '../logic'
import { Checkbox, CopyButton, Input, Note } from '../ui'

/** Code points worth showing as a character (no controls, no lone surrogates). */
const isPrintable = (n: bigint) =>
  n >= 0x21n && n < 0x110000n && !(n >= 0x7fn && n < 0xa0n) && !(n >= 0xd800n && n < 0xe000n)

/*
 * One source of truth: the field the user last typed in (its base + text). Every other
 * field is derived from it, so typing never fights with formatting.
 */
export default function NumberBase() {
  const [source, setSource] = useState<{ base: number; text: string }>({ base: 10, text: '255' })
  const [custom, setCustom] = useState('36')
  const [grouped, setGrouped] = useState(true)

  const customBase = Math.min(36, Math.max(2, Math.floor(Number(custom)) || 36))

  const parsed = useMemo(() => {
    if (!source.text.trim()) return null
    try {
      return { ok: true as const, value: parseBigInt(source.text, source.base) }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [source])

  const show = (base: number) => {
    if (source.base === base) return source.text
    if (!parsed?.ok) return ''
    const s = parsed.value.toString(base)
    if (!grouped) return s
    return base === 10 ? groupDigits(s, 3, ',') : base === 2 || base === 16 ? groupDigits(s, 4) : s
  }

  const value = parsed?.ok ? parsed.value : null
  const bits = value === null ? 0 : (value < 0n ? -value : value).toString(2).length

  return (
    <div className="space-y-5">
      <div className="grid gap-4">
        {BASES.map((b) => (
          <div key={b.base} className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <Input
                label={`${b.label} (base ${b.base})`}
                value={show(b.base)}
                onChange={(text) => setSource({ base: b.base, text })}
                invalid={source.base === b.base && parsed?.ok === false}
              />
            </div>
            <div className="pb-2">
              <CopyButton
                value={value === null ? '' : b.prefix + value.toString(b.base)}
                label={b.prefix ? `Copy ${b.prefix}` : 'Copy'}
              />
            </div>
          </div>
        ))}
        <div className="flex items-end gap-2">
          <div className="w-24">
            <Input
              label="Base"
              type="number"
              min={2}
              max={36}
              value={custom}
              onChange={setCustom}
            />
          </div>
          <div className="min-w-0 flex-1">
            <Input
              label={`Base ${customBase}`}
              value={show(customBase)}
              onChange={(text) => setSource({ base: customBase, text })}
              invalid={source.base === customBase && parsed?.ok === false}
            />
          </div>
        </div>
      </div>
      <Checkbox label="Group digits for readability" checked={grouped} onChange={setGrouped} />
      {parsed?.ok === false ? (
        <Note tone="error">✗ {parsed.error}</Note>
      ) : (
        value !== null && (
          <Note>
            {bits} bit{bits === 1 ? '' : 's'} · fits in{' '}
            {value >= -(2n ** 31n) && value < 2n ** 31n
              ? 'a 32-bit signed int'
              : value >= -(2n ** 63n) && value < 2n ** 63n
                ? 'a 64-bit signed int (BigInt in JavaScript beyond 2⁵³)'
                : 'no fixed-size integer — BigInt only'}
            {isPrintable(value) && ` · Unicode character: ${String.fromCodePoint(Number(value))}`}
          </Note>
        )
      )}
      <Note>
        Works with integers of any size. Prefixes (0x, 0b, 0o), spaces and underscores are ignored.
      </Note>
    </div>
  )
}
