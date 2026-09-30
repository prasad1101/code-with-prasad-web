import { useEffect, useState, type ChangeEvent } from 'react'
import { ActionButton, Checkbox, Input, Note, ResultRow, Segmented, TextArea, Toolbar } from '../ui'

const ALGORITHMS = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'] as const
type Algorithm = (typeof ALGORITHMS)[number]

const OUTPUTS = [
  { value: 'hex', label: 'Hex' },
  { value: 'base64', label: 'Base64' },
] as const

const MAX_FILE = 200 * 1024 * 1024

const toHex = (buf: ArrayBuffer) =>
  [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
const toB64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)))

async function digest(alg: Algorithm, data: BufferSource, key: string | null) {
  if (key === null) return crypto.subtle.digest(alg, data)
  const k = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(key),
    { name: 'HMAC', hash: alg },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', k, data)
}

export default function HashGenerator() {
  const [text, setText] = useState('Hello, Code with Prasad!')
  const [file, setFile] = useState<{ name: string; data: ArrayBuffer } | null>(null)
  const [useHmac, setUseHmac] = useState(false)
  const [key, setKey] = useState('my-secret-key')
  const [output, setOutput] = useState<(typeof OUTPUTS)[number]['value']>('hex')
  const [upper, setUpper] = useState(false)
  const [expected, setExpected] = useState('')
  const [hashes, setHashes] = useState<Partial<Record<Algorithm, ArrayBuffer>>>({})
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    if (!globalThis.crypto?.subtle) return
    const data = file ? file.data : new TextEncoder().encode(text)
    Promise.all(ALGORITHMS.map((a) => digest(a, data, useHmac ? key : null))).then(
      (bufs) => {
        if (cancelled) return
        setHashes(Object.fromEntries(ALGORITHMS.map((a, i) => [a, bufs[i]])))
        setError('')
      },
      (e: unknown) => !cancelled && setError(String(e)),
    )
    return () => {
      cancelled = true
    }
  }, [text, file, useHmac, key])

  const fmt = (buf?: ArrayBuffer) => {
    if (!buf) return ''
    const s = output === 'hex' ? toHex(buf) : toB64(buf)
    return upper && output === 'hex' ? s.toUpperCase() : s
  }
  const want = expected.trim().toLowerCase()
  const match = want ? ALGORITHMS.find((a) => fmt(hashes[a]).toLowerCase() === want) : undefined

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (f.size > MAX_FILE) {
      setError(`${f.name} is larger than 200 MB.`)
      return
    }
    setError('')
    setFile({ name: f.name, data: await f.arrayBuffer() })
  }

  return (
    <div className="space-y-5">
      {file ? (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm">
            Hashing file <strong className="font-mono">{file.name}</strong>{' '}
            <span className="text-muted">({(file.data.byteLength / 1024).toFixed(1)} KB)</span>
          </p>
          <ActionButton onClick={() => setFile(null)}>Hash text instead</ActionButton>
        </div>
      ) : (
        <TextArea label="Text to hash" value={text} onChange={setText} rows={6} />
      )}
      <Toolbar>
        <Segmented label="Output encoding" value={output} onChange={setOutput} options={OUTPUTS} />
        {output === 'hex' && <Checkbox label="Uppercase" checked={upper} onChange={setUpper} />}
        <Checkbox label="HMAC with secret key" checked={useHmac} onChange={setUseHmac} />
        <label className="border-line text-fg hover:border-accent/60 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold">
          Hash a file…
          <input type="file" className="sr-only" onChange={onFile} />
        </label>
      </Toolbar>
      {useHmac && <Input label="Secret key" value={key} onChange={setKey} />}
      {!globalThis.crypto?.subtle && (
        <Note tone="error">
          ✗ Hashing needs a secure (https) page — the Web Crypto API is unavailable here.
        </Note>
      )}
      {error && <Note tone="error">✗ {error}</Note>}
      <div className="grid gap-2">
        {ALGORITHMS.map((a) => (
          <ResultRow key={a} label={useHmac ? `HMAC ${a}` : a} value={fmt(hashes[a])} />
        ))}
      </div>
      <Input
        label="Compare with expected hash (optional)"
        value={expected}
        onChange={setExpected}
        placeholder="Paste a checksum to verify"
      />
      {want && (
        <Note tone={match ? 'ok' : 'error'}>
          {match ? `✓ Matches the ${match} hash` : '✗ Does not match any of the hashes above'}
        </Note>
      )}
      <Note>
        MD5 isn&apos;t offered: it&apos;s broken for security use and browsers don&apos;t provide
        it. For storing passwords, use a slow algorithm such as bcrypt, scrypt or Argon2 — never a
        plain SHA hash.
      </Note>
    </div>
  )
}
