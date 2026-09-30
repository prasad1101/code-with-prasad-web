import { useMemo, useState } from 'react'
import { decodeJwt, relativeTime } from '../logic'
import { Note, TextArea, TwoCol } from '../ui'

// A made-up token for the example (signature is not real).
const SAMPLE =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NSIsIm5hbWUiOiJQcmFzYWQgUGF3YXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3OTA4MTI4MDAsImV4cCI6MTc5MDgxNjQwMH0.c2lnbmF0dXJlLW5vdC1yZWFs'

const CLAIM_NAMES: Record<string, string> = {
  iss: 'Issuer',
  sub: 'Subject (user id)',
  aud: 'Audience',
  exp: 'Expiration time',
  nbf: 'Not before',
  iat: 'Issued at',
  jti: 'JWT id',
  alg: 'Signing algorithm',
  typ: 'Token type',
  kid: 'Key id',
}

function Json({ label, value }: { label: string; value: Record<string, unknown> }) {
  return <TextArea label={label} value={JSON.stringify(value, null, 2)} readOnly rows={10} />
}

export default function JwtDecoder() {
  const [token, setToken] = useState(SAMPLE)

  const result = useMemo(() => {
    if (!token.trim()) return null
    try {
      return { ok: true as const, jwt: decodeJwt(token) }
    } catch (e) {
      return { ok: false as const, error: e instanceof Error ? e.message : String(e) }
    }
  }, [token])

  const known = result?.ok
    ? Object.keys({ ...result.jwt.header, ...result.jwt.payload }).filter((k) => CLAIM_NAMES[k])
    : []

  return (
    <div className="space-y-5">
      <TextArea
        label="Encoded token"
        value={token}
        onChange={setToken}
        rows={5}
        placeholder="Paste a JWT (with or without the “Bearer ” prefix)"
        invalid={result?.ok === false}
      />
      {result?.ok === false && <Note tone="error">✗ {result.error}</Note>}
      {result?.ok && (
        <>
          <div
            className={`card flex flex-wrap items-center gap-x-6 gap-y-2 p-4 text-sm ${
              result.jwt.expired
                ? 'border-red-500/40'
                : result.jwt.expired === false
                  ? 'border-emerald-500/40'
                  : ''
            }`}
            role="status"
          >
            <strong
              className={
                result.jwt.expired
                  ? 'text-red-500'
                  : result.jwt.expired === false
                    ? 'text-emerald-500'
                    : ''
              }
            >
              {result.jwt.expired === null
                ? 'No expiry (exp) claim'
                : result.jwt.expired
                  ? '✗ Expired'
                  : '✓ Not expired'}
            </strong>
            {result.jwt.claims.map((c) => (
              <span key={c.name}>
                <span className="text-muted">{c.label}:</span> {c.date.toLocaleString()}{' '}
                <span className="text-muted">({relativeTime(c.date)})</span>
              </span>
            ))}
          </div>
          <TwoCol>
            <Json label="Header" value={result.jwt.header} />
            <Json label="Payload" value={result.jwt.payload} />
          </TwoCol>
          {known.length > 0 && (
            <dl className="text-muted grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
              {known.map((k) => (
                <div key={k} className="flex gap-2">
                  <dt className="text-fg font-mono">{k}</dt>
                  <dd>{CLAIM_NAMES[k]}</dd>
                </div>
              ))}
            </dl>
          )}
          <Note>
            Decoding only reads the token — it does not verify the signature. Never trust a
            JWT&apos;s claims on the server without verifying it with the secret or public key. The
            token never leaves your browser.
          </Note>
        </>
      )}
    </div>
  )
}
