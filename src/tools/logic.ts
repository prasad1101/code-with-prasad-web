/*
 * Pure logic behind the developer tools. No React and no imports, so every function
 * here can be unit-tested directly in Node.
 */

/* ---------- JSON ---------- */

export type JsonResult = { ok: true; value: unknown } | { ok: false; error: string }

/** JSON.parse with a friendlier error that always includes a line and column. */
export function parseJson(text: string): JsonResult {
  try {
    return { ok: true, value: JSON.parse(text) }
  } catch (e) {
    const msg = (e instanceof Error ? e.message : String(e)).replace(
      /, ".*" is not valid JSON$/s,
      '',
    )
    const at = locateJsonError(text)
    if (at === null) return { ok: false, error: msg }
    const { line, column } = lineCol(text, at.index)
    return { ok: false, error: `${at.message} at line ${line}, column ${column}` }
  }
}

/**
 * Minimal JSON scanner that finds where parsing first fails — engines' messages don't
 * always carry a position. Returns null if the text is valid.
 */
export function locateJsonError(text: string): { index: number; message: string } | null {
  let i = 0
  type Failure = { fail: true; index: number; message: string }
  const fail = (message: string): never => {
    throw { fail: true, index: i, message } satisfies Failure
  }
  const ws = () => {
    while (i < text.length && ' \t\n\r'.includes(text[i])) i++
  }
  const describe = () =>
    i >= text.length ? 'Unexpected end of input' : `Unexpected ${JSON.stringify(text[i])}`
  const expect = (ch: string) => {
    if (text[i] !== ch) fail(`${describe()}, expected ${JSON.stringify(ch)}`)
    i++
  }
  const string = () => {
    expect('"')
    while (i < text.length && text[i] !== '"') {
      const c = text[i]
      if (c < ' ') fail('Control character (e.g. a raw newline) inside a string')
      if (c === '\\') {
        const n = text[i + 1]
        if (n === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(i + 2, i + 6))) fail('Invalid \\u escape')
          i += 6
          continue
        }
        if (!n || !'"\\/bfnrt'.includes(n)) fail(`Invalid escape "\\${n ?? ''}"`)
        i += 2
        continue
      }
      i++
    }
    if (i >= text.length) fail('Unterminated string')
    i++
  }
  const value = (): void => {
    ws()
    const c = text[i]
    if (c === '{') {
      i++
      ws()
      if (text[i] === '}') return void i++
      for (;;) {
        ws()
        if (text[i] !== '"')
          fail(
            text[i] === '}'
              ? 'Trailing comma before "}"'
              : `${describe()}, expected a "quoted" property name`,
          )
        string()
        ws()
        expect(':')
        value()
        ws()
        if (text[i] === ',') {
          i++
          continue
        }
        expect('}')
        return
      }
    }
    if (c === '[') {
      i++
      ws()
      if (text[i] === ']') return void i++
      for (;;) {
        ws()
        if (text[i] === ']') fail('Trailing comma before "]"')
        value()
        ws()
        if (text[i] === ',') {
          i++
          continue
        }
        expect(']')
        return
      }
    }
    if (c === '"') return string()
    const lit = /^(true|false|null|-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?)/.exec(
      text.slice(i, i + 400),
    )
    if (lit) {
      i += lit[0].length
      return
    }
    if (c === "'") fail('Strings must use double quotes')
    fail(i >= text.length ? 'Unexpected end of input' : `${describe()}, expected a value`)
  }
  try {
    value()
    ws()
    if (i < text.length) fail(`${describe()} after the end of the JSON value`)
    return null
  } catch (e) {
    if (e && typeof e === 'object' && 'fail' in e)
      return { index: (e as Failure).index, message: (e as Failure).message }
    throw e
  }
}

export function lineCol(text: string, index: number) {
  const before = text.slice(0, index).split('\n')
  return { line: before.length, column: before[before.length - 1].length + 1 }
}

/** Recursively sort object keys (arrays keep their order). */
export function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .map((k) => [k, sortKeys((value as Record<string, unknown>)[k])]),
    )
  }
  return value
}

/** Flatten nested objects into dotted keys for CSV export: {a:{b:1}} → {"a.b":1}. */
export function flatten(obj: unknown, prefix = '', out: Record<string, unknown> = {}) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    const entries = Object.entries(obj)
    if (!entries.length && prefix) out[prefix] = ''
    for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out)
  } else if (Array.isArray(obj)) {
    out[prefix] = JSON.stringify(obj)
  } else {
    out[prefix] = obj
  }
  return out
}

/* ---------- Base64 / URL ---------- */

export function base64Encode(text: string, urlSafe = false): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  const b64 = btoa(bin)
  return urlSafe ? b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') : b64
}

/** Accepts standard or URL-safe Base64, with or without padding and whitespace. */
export function base64Decode(input: string): string {
  let s = input.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')
  if (/[^A-Za-z0-9+/=]/.test(s)) throw new Error('Input contains characters that are not Base64')
  s = s.replace(/=+$/, '')
  if (s.length % 4 === 1) throw new Error('Invalid Base64 length')
  s += '='.repeat((4 - (s.length % 4)) % 4)
  const bin = atob(s)
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0))
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    throw new Error(
      'The decoded bytes are not UTF-8 text (probably binary data such as an image or a zip)',
    )
  }
}

/** Decodes percent-encoding; `+` is treated as a space when `plusAsSpace` (form encoding). */
export function urlDecode(text: string, plusAsSpace = false) {
  return decodeURIComponent(plusAsSpace ? text.replace(/\+/g, ' ') : text)
}

export type UrlPart = { key: string; value: string }

/** Break a URL into its parts and decoded query parameters. */
export function parseUrl(text: string) {
  const u = new URL(text.trim())
  const params: UrlPart[] = []
  u.searchParams.forEach((value, key) => params.push({ key, value }))
  return {
    protocol: u.protocol,
    host: u.host,
    pathname: decodeURIComponent(u.pathname),
    hash: u.hash,
    params,
  }
}

/* ---------- JWT ---------- */

export type DecodedJwt = {
  header: Record<string, unknown>
  payload: Record<string, unknown>
  signature: string
  claims: { name: string; label: string; date: Date }[]
  expired: boolean | null
}

export function decodeJwt(token: string, now = Date.now()): DecodedJwt {
  const parts = token
    .trim()
    .replace(/^Bearer\s+/i, '')
    .split('.')
  if (parts.length !== 3)
    throw new Error('A JWT has three parts separated by dots (header.payload.signature)')
  const part = (s: string, what: string) => {
    try {
      const v = JSON.parse(base64Decode(s))
      if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error()
      return v as Record<string, unknown>
    } catch {
      throw new Error(`The ${what} is not valid Base64URL-encoded JSON`)
    }
  }
  const header = part(parts[0], 'header')
  const payload = part(parts[1], 'payload')
  const labels: Record<string, string> = { iat: 'Issued at', nbf: 'Not before', exp: 'Expires' }
  const claims = Object.entries(labels)
    .filter(([k]) => typeof payload[k] === 'number')
    .map(([k, label]) => ({ name: k, label, date: new Date((payload[k] as number) * 1000) }))
  const expired = typeof payload.exp === 'number' ? payload.exp * 1000 < now : null
  return { header, payload, signature: parts[2], claims, expired }
}

/* ---------- Timestamps ---------- */

/** Interpret a number as a Unix timestamp, guessing the unit from its magnitude. */
export function parseTimestamp(input: string): { date: Date; unit: string } | null {
  const s = input.trim()
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null
  const n = Number(s)
  const abs = Math.abs(n)
  const [ms, unit] =
    abs >= 1e17
      ? [n / 1e6, 'nanoseconds']
      : abs >= 1e14
        ? [n / 1e3, 'microseconds']
        : abs >= 1e11
          ? [n, 'milliseconds']
          : [n * 1000, 'seconds']
  const date = new Date(ms)
  return Number.isNaN(date.getTime()) ? null : { date, unit }
}

/** "3 hours ago", "in 2 days" … */
export function relativeTime(date: Date, now = Date.now()): string {
  const diff = (date.getTime() - now) / 1000
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ]
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  for (const [unit, secs] of units) {
    if (Math.abs(diff) >= secs || unit === 'second')
      return rtf.format(Math.round(diff / secs), unit)
  }
  return ''
}

/** Wall-clock time of `date` in an IANA zone, as "2026-09-30 14:05:09". */
export function formatInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')}`
}

/** Interpret "YYYY-MM-DDTHH:mm[:ss]" as wall-clock time in `timeZone` and return the instant. */
export function zonedToDate(local: string, timeZone: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/.exec(local.trim())
  if (!m) return null
  const [y, mo, d, h, mi, s] = m.slice(1).map((v) => Number(v ?? 0))
  const asUtc = Date.UTC(y, mo - 1, d, h, mi, s)
  // Find the zone offset at that moment (twice, to settle across DST changes).
  let guess = asUtc
  for (let i = 0; i < 2; i++) {
    const shown = formatInZone(new Date(guess), timeZone)
    const [date, time] = shown.split(' ')
    const [yy, mm, dd] = date.split('-').map(Number)
    const [hh, mn, ss] = time.split(':').map(Number)
    const offset = Date.UTC(yy, mm - 1, dd, hh, mn, ss) - guess
    guess = asUtc - offset
  }
  return new Date(guess)
}

/* ---------- Number bases ---------- */

export const BASES = [
  { base: 2, label: 'Binary', prefix: '0b' },
  { base: 8, label: 'Octal', prefix: '0o' },
  { base: 10, label: 'Decimal', prefix: '' },
  { base: 16, label: 'Hexadecimal', prefix: '0x' },
] as const

const DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

/** Parse an integer of any size in the given base (2–36). Allows 0x/0b/0o prefixes, _ and spaces. */
export function parseBigInt(input: string, base: number): bigint {
  let s = input.trim().toLowerCase().replace(/[\s_]/g, '')
  let neg = false
  if (s.startsWith('-')) {
    neg = true
    s = s.slice(1)
  }
  const prefix = { 2: '0b', 8: '0o', 16: '0x' }[base as 2 | 8 | 16]
  if (prefix && s.startsWith(prefix)) s = s.slice(2)
  if (!s) throw new Error('Enter a number')
  const b = BigInt(base)
  let n = 0n
  for (const ch of s) {
    const d = DIGITS.indexOf(ch)
    if (d < 0 || d >= base) throw new Error(`"${ch}" is not a valid base-${base} digit`)
    n = n * b + BigInt(d)
  }
  return neg ? -n : n
}

/** Group digits for readability: binary in 4s, hex in 4s, decimal in 3s. */
export function groupDigits(s: string, size: number, sep = ' ') {
  const neg = s.startsWith('-')
  const body = neg ? s.slice(1) : s
  const out: string[] = []
  for (let i = body.length; i > 0; i -= size) out.unshift(body.slice(Math.max(0, i - size), i))
  return (neg ? '-' : '') + out.join(sep)
}

/* ---------- Colours ---------- */

export type Rgb = { r: number; g: number; b: number; a: number }

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const round = (n: number, d = 0) => Math.round(n * 10 ** d) / 10 ** d

/** Parse #rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba() and hsl()/hsla() (comma or space syntax). */
export function parseColor(input: string): Rgb | null {
  const s = input.trim().toLowerCase()
  const hex = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s)
  if (hex) {
    let h = hex[1]
    if (h.length <= 4) h = [...h].map((c) => c + c).join('')
    const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
    return { r: n(0), g: n(2), b: n(4), a: h.length === 8 ? round(n(6) / 255, 3) : 1 }
  }
  const fn = /^(rgba?|hsla?)\(\s*([^)]*)\)$/.exec(s)
  if (!fn) return null
  const parts = fn[2].split(/[\s,/]+/).filter(Boolean)
  if (parts.length < 3 || parts.length > 4) return null
  const alpha =
    parts[3] === undefined
      ? 1
      : parts[3].endsWith('%')
        ? parseFloat(parts[3]) / 100
        : parseFloat(parts[3])
  if (Number.isNaN(alpha)) return null
  const a = clamp(alpha, 0, 1)
  if (fn[1].startsWith('rgb')) {
    const [r, g, b] = parts
      .slice(0, 3)
      .map((p) => (p.endsWith('%') ? (parseFloat(p) * 255) / 100 : parseFloat(p)))
    if ([r, g, b].some(Number.isNaN)) return null
    return {
      r: clamp(Math.round(r), 0, 255),
      g: clamp(Math.round(g), 0, 255),
      b: clamp(Math.round(b), 0, 255),
      a,
    }
  }
  const [h, sat, l] = [parseFloat(parts[0]), parseFloat(parts[1]), parseFloat(parts[2])]
  if ([h, sat, l].some(Number.isNaN)) return null
  return { ...hslToRgb(h, clamp(sat, 0, 100), clamp(l, 0, 100)), a }
}

export function hslToRgb(h: number, s: number, l: number) {
  const sat = s / 100
  const lig = l / 100
  const k = (n: number) => (n + h / 30) % 12
  const a = sat * Math.min(lig, 1 - lig)
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) }
}

export function rgbToHsl({ r, g, b }: Rgb) {
  const [rn, gn, bn] = [r / 255, g / 255, b / 255]
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  const d = max - min
  let h = 0
  let s = 0
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1))
    h = max === rn ? ((gn - bn) / d) % 6 : max === gn ? (bn - rn) / d + 2 : (rn - gn) / d + 4
    h = (h * 60 + 360) % 360
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

export function formatColor(c: Rgb) {
  const hx = (n: number) => n.toString(16).padStart(2, '0')
  const { h, s, l } = rgbToHsl(c)
  const hasAlpha = c.a < 1
  return {
    hex: `#${hx(c.r)}${hx(c.g)}${hx(c.b)}${hasAlpha ? hx(Math.round(c.a * 255)) : ''}`,
    rgb: hasAlpha ? `rgb(${c.r} ${c.g} ${c.b} / ${c.a})` : `rgb(${c.r} ${c.g} ${c.b})`,
    hsl: hasAlpha ? `hsl(${h} ${s}% ${l}% / ${c.a})` : `hsl(${h} ${s}% ${l}%)`,
  }
}

/** WCAG 2 relative luminance and contrast ratio. */
export function luminance({ r, g, b }: Rgb) {
  const ch = (v: number) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

export function contrast(a: Rgb, b: Rgb) {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m)
  return round((x + 0.05) / (y + 0.05), 2)
}

/** Lighter-to-darker tints and shades of a colour (same hue and saturation). */
export function shades(c: Rgb, steps = [95, 85, 70, 55, 40, 28, 18]) {
  const { h, s } = rgbToHsl(c)
  return steps.map((l) => formatColor({ ...hslToRgb(h, s, l), a: 1 }).hex)
}

/* ---------- Case conversion ---------- */

/** Split any identifier or sentence into lower-case words. */
export function words(text: string): string[] {
  return (
    text
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .match(/[\p{L}\p{N}]+/gu)
      ?.map((w) => w.toLowerCase()) ?? []
  )
}

const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)

export const CASES = [
  {
    key: 'camel',
    label: 'camelCase',
    fn: (w: string[]) => w.map((x, i) => (i ? cap(x) : x)).join(''),
  },
  { key: 'pascal', label: 'PascalCase', fn: (w: string[]) => w.map(cap).join('') },
  { key: 'snake', label: 'snake_case', fn: (w: string[]) => w.join('_') },
  { key: 'constant', label: 'CONSTANT_CASE', fn: (w: string[]) => w.join('_').toUpperCase() },
  { key: 'kebab', label: 'kebab-case', fn: (w: string[]) => w.join('-') },
  { key: 'train', label: 'Train-Case', fn: (w: string[]) => w.map(cap).join('-') },
  { key: 'dot', label: 'dot.case', fn: (w: string[]) => w.join('.') },
  { key: 'path', label: 'path/case', fn: (w: string[]) => w.join('/') },
  { key: 'title', label: 'Title Case', fn: (w: string[]) => w.map(cap).join(' ') },
  { key: 'sentence', label: 'Sentence case', fn: (w: string[]) => cap(w.join(' ')) },
  { key: 'lower', label: 'lower case', fn: (w: string[]) => w.join(' ') },
  { key: 'upper', label: 'UPPER CASE', fn: (w: string[]) => w.join(' ').toUpperCase() },
] as const

/** Convert each line separately so a list of identifiers converts in one go. */
export const convertCase = (text: string, fn: (w: string[]) => string) =>
  text
    .split('\n')
    .map((line) => fn(words(line)))
    .join('\n')

/* ---------- Random values ---------- */

/** Unbiased random integer in [0, max) from the Web Crypto RNG. */
export function randomInt(max: number): number {
  if (max <= 0) return 0
  const limit = Math.floor(0x100000000 / max) * max
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf)
  while (buf[0] >= limit)
  return buf[0] % max
}

export const CHARSETS = {
  lower: 'abcdefghijklmnopqrstuvwxyz',
  upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  digits: '0123456789',
  symbols: '!@#$%^&*()-_=+[]{};:,.<>?/~',
} as const
export type Charset = keyof typeof CHARSETS
const AMBIGUOUS = /[O0oIl1|`'"]/g

/** Password using the chosen sets, guaranteeing at least one character from each. */
export function generatePassword(length: number, sets: Charset[], excludeAmbiguous = false) {
  const pools = sets.map((s) =>
    excludeAmbiguous ? CHARSETS[s].replace(AMBIGUOUS, '') : CHARSETS[s],
  )
  if (!pools.length) return ''
  const all = pools.join('')
  const chars = pools.map((p) => p[randomInt(p.length)])
  while (chars.length < length) chars.push(all[randomInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1)
    ;[chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.slice(0, length).join('')
}

/** Entropy in bits of a random string, and a label for it. */
export function strength(length: number, poolSize: number) {
  return strengthOf(poolSize > 1 ? length * Math.log2(poolSize) : 0)
}

export function strengthOf(entropyBits: number) {
  const bits = Math.round(entropyBits)
  const label = bits < 40 ? 'Weak' : bits < 60 ? 'Fair' : bits < 80 ? 'Strong' : 'Very strong'
  return { bits, label }
}

const WORDLIST =
  'able acid aged also area army away baby back ball band bank base bath bear beat bell belt best bird blow blue boat body bold bone book boot born boss both bowl brave bread brick bright brush build burn busy cake calm camp card care cart case cash cast cell chair chalk charm chart chef chess chip city clay clean climb clock cloud coach coast coin cold cook cool copy corn cost crab crane crew crisp crowd cube cup curl cycle dance dark dawn deal deep desk dial dice dish dock door dove draft dream drift drum duck dust eager eagle earth east echo edge eight elbow empty engine equal exit fable face fair farm fast feast fern field film fire fish flag flame flash fleet float flock flute focus fog fold forest fork fox frame fresh frog fruit fuel gain game garden gate gear ghost giant gift glass globe glow goat gold grain grape grass green grid grove guard guide habit hall hammer harbor hawk heart hedge helmet hero hill honey hope horse hotel house hunt ice idea inch index ink iron island ivory jacket jade jar jazz jelly jewel judge juice jump jungle kettle key kid king kite knee knife koala label ladder lake lamp land laser lava lawn leaf lemon lens level light lily lime lion lock logic lotus lucky lunar magic mango maple marble market mask meadow melon metal mint mirror model moon moss motor mount mouse music nail needle nest night noble north novel number oak ocean olive onion orbit otter owl paint panda paper park pearl pencil pepper piano pilot pine pixel planet plum pocket polar pond pony potato prism pulse puzzle quartz queen quest quick quiet rabbit radar rain ranch raven reef ridge river robot rocket roof rose royal ruby salad salt sand scale scout sea seed shadow shark shell ship silver sketch sky slate smile snow solar song spark spice spoon spring square star steam stone storm sugar summer sun swan table tango tea tent thunder tiger timber toast token tower trail train tree tulip tunnel turtle umbrella unit urban valley velvet violet vivid voice wagon walnut water wave whale wheat wind window winter wolf wood yacht yard yellow zebra zero zinc zone'.split(
    ' ',
  )

export function generatePassphrase(
  count: number,
  separator = '-',
  capitalize = false,
  addNumber = false,
) {
  const w = Array.from({ length: count }, () => {
    const word = WORDLIST[randomInt(WORDLIST.length)]
    return capitalize ? cap(word) : word
  })
  if (addNumber) w.push(String(randomInt(100)))
  return w.join(separator)
}
export const PASSPHRASE_POOL = WORDLIST.length

/** RFC 9562 UUID version 7: 48-bit Unix ms timestamp + random bits, sortable by time. */
export function uuidV7(now = Date.now()): string {
  const b = new Uint8Array(16)
  crypto.getRandomValues(b)
  let ts = now
  for (let i = 5; i >= 0; i--) {
    b[i] = ts % 256
    ts = Math.floor(ts / 256)
  }
  b[6] = (b[6] & 0x0f) | 0x70
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-([0-9a-f])[0-9a-f]{3}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Version (and embedded time for v7) of a UUID string. */
export function inspectUuid(input: string): { version: number; time?: Date } | null {
  let s = input.trim().replace(/^\{|\}$/g, '')
  if (/^[0-9a-f]{32}$/i.test(s))
    s = `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20)}`
  const m = UUID_RE.exec(s)
  if (!m) return null
  const version = parseInt(m[1], 16)
  if (version === 7)
    return { version, time: new Date(parseInt(s.replace(/-/g, '').slice(0, 12), 16)) }
  return { version }
}

/* ---------- Regex ---------- */

export type RegexMatch = {
  index: number
  text: string
  groups: (string | undefined)[]
  named?: Record<string, string | undefined>
}

export function runRegex(pattern: string, flags: string, text: string, limit = 1000) {
  const re = new RegExp(pattern, flags.includes('g') ? flags : flags + 'g')
  const matches: RegexMatch[] = []
  for (const m of text.matchAll(re)) {
    matches.push({ index: m.index ?? 0, text: m[0], groups: m.slice(1), named: m.groups })
    if (matches.length >= limit) break
  }
  // Without the g flag only the first match counts (mirrors String.prototype.match).
  return flags.includes('g') ? matches : matches.slice(0, 1)
}

/* ---------- Text statistics / lorem ipsum ---------- */

const LOREM =
  'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum'.split(
    ' ',
  )

export function loremWords(n: number, startClassic = true) {
  const out: string[] = []
  for (let i = 0; i < n; i++)
    out.push(startClassic && i < 8 ? LOREM[i] : LOREM[randomInt(LOREM.length)])
  return out
}

export function loremSentence(startClassic = false) {
  const w = loremWords(8 + randomInt(10), startClassic)
  // Sprinkle a comma into longer sentences.
  if (w.length > 10) w[4 + randomInt(w.length - 8)] += ','
  return cap(w.join(' ')) + '.'
}

export function loremParagraph(startClassic = false) {
  return Array.from({ length: 4 + randomInt(4) }, (_, i) =>
    loremSentence(startClassic && i === 0),
  ).join(' ')
}

export function lorem(
  unit: 'paragraphs' | 'sentences' | 'words',
  count: number,
  startClassic: boolean,
) {
  if (unit === 'words') return cap(loremWords(count, startClassic).join(' ')) + '.'
  if (unit === 'sentences')
    return Array.from({ length: count }, (_, i) => loremSentence(startClassic && i === 0)).join(' ')
  return Array.from({ length: count }, (_, i) => loremParagraph(startClassic && i === 0)).join(
    '\n\n',
  )
}

export function textStats(text: string) {
  const trimmed = text.trim()
  return {
    characters: text.length,
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    lines: text ? text.split('\n').length : 0,
    bytes: new TextEncoder().encode(text).length,
  }
}

/* ---------- Cron ---------- */

export const CRON_MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
}

const MONTH_NAMES = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]
const DAY_NAMES = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function cronField(
  field: string,
  min: number,
  max: number,
  what: string,
  names?: string[],
): Set<number> {
  const out = new Set<number>()
  const value = (s: string) => {
    const i = names?.indexOf(s.toLowerCase()) ?? -1
    const n = i >= 0 ? i + min : Number(s)
    if (!/^\d+$/.test(s) && i < 0) throw new Error(`"${s}" is not a valid ${what}`)
    return n
  }
  for (const part of field.split(',')) {
    const [range, stepStr] = part.split('/')
    const step = stepStr === undefined ? 1 : Number(stepStr)
    if (!Number.isInteger(step) || step < 1)
      throw new Error(`Invalid step "/${stepStr}" in ${what}`)
    let lo: number
    let hi: number
    if (range === '*' || range === '?') {
      lo = min
      hi = max
    } else if (range.includes('-')) {
      const [a, b] = range.split('-')
      lo = value(a)
      hi = value(b)
    } else {
      lo = value(range)
      hi = stepStr === undefined ? lo : max
    }
    // Day of week: allow 7 as Sunday.
    const top = what === 'day of week' ? 7 : max
    if (lo < min || hi > top || lo > hi)
      throw new Error(`${what} "${part}" is out of range (${min}–${max})`)
    for (let n = lo; n <= hi; n += step) out.add(what === 'day of week' && n === 7 ? 0 : n)
  }
  return out
}

export type CronSchedule = {
  minutes: Set<number>
  hours: Set<number>
  days: Set<number>
  months: Set<number>
  weekdays: Set<number>
  domRestricted: boolean
  dowRestricted: boolean
}

/** Parse a standard 5-field cron expression (or an @macro). */
export function parseCron(expr: string): CronSchedule {
  const src = CRON_MACROS[expr.trim().toLowerCase()] ?? expr.trim()
  const f = src.split(/\s+/)
  if (f.length !== 5)
    throw new Error(`Expected 5 fields (minute hour day month weekday), got ${f.length}`)
  return {
    minutes: cronField(f[0], 0, 59, 'minute'),
    hours: cronField(f[1], 0, 23, 'hour'),
    days: cronField(f[2], 1, 31, 'day of month'),
    months: cronField(f[3], 1, 12, 'month', MONTH_NAMES),
    weekdays: cronField(f[4], 0, 6, 'day of week', DAY_NAMES),
    domRestricted: !/^[*?]$/.test(f[2]),
    dowRestricted: !/^[*?]$/.test(f[4]),
  }
}

/** Next `count` run times after `from`, evaluated in UTC or the browser's local time. */
export function nextCronRuns(s: CronSchedule, from: Date, count: number, utc = false): Date[] {
  const make = (y: number, mo: number, d: number, h = 0, mi = 0) =>
    utc ? new Date(Date.UTC(y, mo, d, h, mi)) : new Date(y, mo, d, h, mi)
  const parts = (d: Date) =>
    utc
      ? [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCDay()]
      : [d.getFullYear(), d.getMonth(), d.getDate(), d.getDay()]
  const runs: Date[] = []
  const hours = [...s.hours].sort((a, b) => a - b)
  const minutes = [...s.minutes].sort((a, b) => a - b)
  const [y0, m0, d0] = parts(from)
  // Scan day by day for up to ~9 years, so Feb 29 schedules still find two runs.
  for (let i = 0; i < 366 * 9 && runs.length < count; i++) {
    const day = make(y0, m0, d0 + i)
    const [y, mo, d, dow] = parts(day)
    if (!s.months.has(mo + 1)) continue
    const domOk = s.days.has(d)
    const dowOk = s.weekdays.has(dow)
    // Vixie cron: when both day fields are restricted, either may match.
    const dayOk = s.domRestricted && s.dowRestricted ? domOk || dowOk : domOk && dowOk
    if (!dayOk) continue
    for (const h of hours) {
      for (const mi of minutes) {
        const t = make(y, mo, d, h, mi)
        if (t > from && runs.length < count) runs.push(t)
      }
    }
  }
  return runs
}
