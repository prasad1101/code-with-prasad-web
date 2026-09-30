import { useMemo, useState } from 'react'
import { contrast, formatColor, parseColor, shades, type Rgb } from '../logic'
import { CopyButton, Input, Note, ResultRow } from '../ui'

const WHITE: Rgb = { r: 255, g: 255, b: 255, a: 1 }
const BLACK: Rgb = { r: 0, g: 0, b: 0, a: 1 }

function Contrast({ fg, bg, fgLabel }: { fg: Rgb; bg: Rgb; fgLabel: string }) {
  const ratio = contrast(fg, bg)
  const grade =
    ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA large text only' : 'Fails'
  const { hex: bgHex } = formatColor({ ...bg, a: 1 })
  const { hex: fgHex } = formatColor({ ...fg, a: 1 })
  return (
    <div className="border-line overflow-hidden rounded-xl border">
      <div className="px-4 py-5 text-lg font-semibold" style={{ background: bgHex, color: fgHex }}>
        {fgLabel} text on this colour
      </div>
      <div className="bg-surface flex justify-between px-4 py-2 text-sm">
        <span className="font-mono">{ratio}:1</span>
        <span className={grade === 'Fails' ? 'text-red-500' : 'text-emerald-500'}>
          {grade === 'Fails' ? '✗ ' : '✓ '}
          {grade}
        </span>
      </div>
    </div>
  )
}

export default function ColorConverter() {
  const [input, setInput] = useState('#6d28d9')
  const color = useMemo(() => parseColor(input), [input])
  const formats = color ? formatColor(color) : null
  const solid = color ? formatColor({ ...color, a: 1 }).hex : '#000000'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-2">
          <span className="text-muted text-xs font-semibold tracking-wide uppercase">Pick</span>
          <input
            type="color"
            value={solid}
            onChange={(e) => setInput(e.target.value)}
            className="border-line size-12 cursor-pointer rounded-xl border bg-transparent p-1"
          />
        </label>
        <div className="min-w-0 flex-1">
          <Input
            label="HEX, RGB or HSL"
            value={input}
            onChange={setInput}
            placeholder="#0e7490, rgb(14 116 144), hsl(193 82% 31%)"
            invalid={!color && !!input.trim()}
          />
        </div>
      </div>
      {!color && input.trim() && (
        <Note tone="error">
          ✗ Couldn&apos;t read that colour. Try #rrggbb, rgb(r g b) or hsl(h s% l%).
        </Note>
      )}
      {color && formats && (
        <>
          <div className="grid gap-5 md:grid-cols-[12rem_1fr]">
            <div
              className="border-line h-40 rounded-2xl border md:h-full"
              style={{ background: formats.rgb }}
              role="img"
              aria-label={`Colour swatch ${formats.hex}`}
            />
            <div className="grid content-start gap-2">
              <ResultRow label="HEX" value={formats.hex} />
              <ResultRow label="RGB" value={formats.rgb} />
              <ResultRow label="HSL" value={formats.hsl} />
              <ResultRow label="CSS variable" value={`--color-primary: ${formats.hex};`} />
              <ResultRow label="Tailwind" value={`bg-[${formats.hex}]`} />
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Tints &amp; shades</h2>
            <ul className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {shades(color).map((hex) => (
                <li key={hex}>
                  <button
                    type="button"
                    onClick={() => setInput(hex)}
                    className="border-line group w-full overflow-hidden rounded-xl border text-left"
                    aria-label={`Use ${hex}`}
                  >
                    <span className="block h-14" style={{ background: hex }} />
                    <span className="bg-surface text-muted group-hover:text-fg block px-2 py-1 font-mono text-xs">
                      {hex}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Text contrast (WCAG 2)</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Contrast fg={WHITE} bg={color} fgLabel="White" />
              <Contrast fg={BLACK} bg={color} fgLabel="Black" />
            </div>
            <p className="text-muted mt-3 text-sm">
              AA needs 4.5:1 for body text and 3:1 for large text; AAA needs 7:1.{' '}
              <CopyButton value={formats.hex} label="Copy HEX" />
            </p>
          </div>
        </>
      )}
    </div>
  )
}
