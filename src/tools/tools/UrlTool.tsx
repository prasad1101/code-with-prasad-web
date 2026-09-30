import { useMemo, useState } from 'react'
import { parseUrl, urlDecode } from '../logic'
import {
  Checkbox,
  CopyButton,
  Input,
  Note,
  ResultRow,
  Segmented,
  TextArea,
  Toolbar,
  TwoCol,
} from '../ui'

const MODES = [
  { value: 'encode', label: 'Encode' },
  { value: 'decode', label: 'Decode' },
] as const

export default function UrlTool() {
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('encode')
  const [input, setInput] = useState('name=Prasad Pawar&topic=React & Node.js&emoji=👋')
  const [component, setComponent] = useState(true)
  const [plus, setPlus] = useState(true)
  const [url, setUrl] = useState(
    'https://codewithprasad.in/search?q=react%20hooks&level=Expert&tags=js&tags=ts#results',
  )

  const result = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      if (mode === 'decode') return { output: urlDecode(input, plus), error: '' }
      return { output: component ? encodeURIComponent(input) : encodeURI(input), error: '' }
    } catch {
      return {
        output: '',
        error: 'Malformed percent-encoding — every % must be followed by two hex digits.',
      }
    }
  }, [input, mode, component, plus])

  const parsed = useMemo(() => {
    if (!url.trim()) return null
    try {
      return parseUrl(url)
    } catch {
      return 'invalid' as const
    }
  }, [url])

  return (
    <div className="space-y-10">
      <section className="space-y-5" aria-labelledby="url-encode">
        <h2 id="url-encode" className="text-xl font-semibold">
          Encode / decode
        </h2>
        <Toolbar>
          <Segmented label="Mode" value={mode} onChange={setMode} options={MODES} />
          {mode === 'encode' ? (
            <Checkbox
              label="Encode as component (also escapes & = ? / #)"
              checked={component}
              onChange={setComponent}
            />
          ) : (
            <Checkbox label="Treat + as space" checked={plus} onChange={setPlus} />
          )}
        </Toolbar>
        <TwoCol>
          <TextArea
            label="Input"
            value={input}
            onChange={setInput}
            rows={6}
            invalid={!!result.error}
          />
          <TextArea label="Output" value={result.output} readOnly rows={6} />
        </TwoCol>
        {result.error && <Note tone="error">✗ {result.error}</Note>}
      </section>

      <section className="space-y-5" aria-labelledby="url-parse">
        <h2 id="url-parse" className="text-xl font-semibold">
          URL parser
        </h2>
        <Input
          label="Full URL"
          value={url}
          onChange={setUrl}
          placeholder="https://example.com/path?x=1"
          invalid={parsed === 'invalid'}
        />
        {parsed === 'invalid' ? (
          <Note tone="error">✗ Not a valid absolute URL — include the scheme, e.g. https://</Note>
        ) : (
          parsed && (
            <div className="space-y-4">
              <div className="grid gap-2">
                <ResultRow label="Protocol" value={parsed.protocol} />
                <ResultRow label="Host" value={parsed.host} />
                <ResultRow label="Path" value={parsed.pathname} />
                <ResultRow label="Hash" value={parsed.hash} />
              </div>
              <div className="card overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <caption className="text-muted px-4 pt-3 text-left text-xs font-semibold tracking-wide uppercase">
                    Query parameters ({parsed.params.length})
                  </caption>
                  <thead>
                    <tr className="border-line border-b">
                      <th className="px-4 py-2 font-semibold">Key</th>
                      <th className="px-4 py-2 font-semibold">Value (decoded)</th>
                      <th className="w-20" />
                    </tr>
                  </thead>
                  <tbody className="font-mono">
                    {parsed.params.map((p, i) => (
                      <tr key={i} className="border-line border-b last:border-0">
                        <td className="px-4 py-2">{p.key}</td>
                        <td className="px-4 py-2 break-all">{p.value}</td>
                        <td className="px-2 py-2 text-right">
                          <CopyButton value={p.value} />
                        </td>
                      </tr>
                    ))}
                    {!parsed.params.length && (
                      <tr>
                        <td colSpan={3} className="text-muted px-4 py-3 font-sans">
                          No query parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </section>
    </div>
  )
}
