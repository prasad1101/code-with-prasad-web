import { useMemo, useState, type ChangeEvent } from 'react'
import { base64Decode, base64Encode } from '../logic'
import { ActionButton, Checkbox, Note, Segmented, TextArea, Toolbar, TwoCol } from '../ui'

const MODES = [
  { value: 'encode', label: 'Encode' },
  { value: 'decode', label: 'Decode' },
] as const

const MAX_FILE = 5 * 1024 * 1024

export default function Base64Tool() {
  const [mode, setMode] = useState<(typeof MODES)[number]['value']>('encode')
  const [input, setInput] = useState('Hello, Code with Prasad! नमस्ते 👋')
  const [urlSafe, setUrlSafe] = useState(false)
  const [fileNote, setFileNote] = useState('')
  const [dataUrl, setDataUrl] = useState('')

  const result = useMemo(() => {
    if (!input) return { output: '', error: '' }
    try {
      return {
        output: mode === 'encode' ? base64Encode(input, urlSafe) : base64Decode(input),
        error: '',
      }
    } catch (e) {
      return { output: '', error: e instanceof Error ? e.message : String(e) }
    }
  }, [input, mode, urlSafe])

  const swap = () => {
    setMode(mode === 'encode' ? 'decode' : 'encode')
    setInput(result.output)
    setFileNote('')
  }

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FILE) {
      setFileNote(`${file.name} is larger than 5 MB — too big to show here.`)
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setFileNote(`${file.name} (${(file.size / 1024).toFixed(1)} KB) as a data URL:`)
      setDataUrl(String(reader.result))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-5">
      <Toolbar>
        <Segmented
          label="Mode"
          value={mode}
          onChange={(m) => (setMode(m), setDataUrl(''), setFileNote(''))}
          options={MODES}
        />
        {mode === 'encode' && (
          <Checkbox label="URL-safe (no + / =)" checked={urlSafe} onChange={setUrlSafe} />
        )}
        <ActionButton onClick={swap}>⇄ Use output as input</ActionButton>
        <label className="border-line text-fg hover:border-accent/60 inline-flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold">
          Encode a file…
          <input type="file" className="sr-only" onChange={onFile} />
        </label>
      </Toolbar>
      {dataUrl ? (
        <div className="space-y-3">
          <Note>{fileNote}</Note>
          <TextArea label="Data URL" value={dataUrl} readOnly rows={8} />
          {dataUrl.startsWith('data:image/') && (
            <img
              src={dataUrl}
              alt="Preview of the encoded file"
              className="border-line max-h-48 rounded-xl border"
            />
          )}
          <ActionButton onClick={() => (setDataUrl(''), setFileNote(''))}>
            Back to text
          </ActionButton>
        </div>
      ) : (
        <>
          <TwoCol>
            <TextArea
              label={mode === 'encode' ? 'Plain text' : 'Base64'}
              value={input}
              onChange={setInput}
              rows={12}
              invalid={!!result.error}
            />
            <TextArea
              label={mode === 'encode' ? 'Base64' : 'Plain text'}
              value={result.output}
              readOnly
              rows={12}
            />
          </TwoCol>
          {result.error ? (
            <Note tone="error">✗ {result.error}</Note>
          ) : (
            fileNote && <Note tone="error">{fileNote}</Note>
          )}
          <Note>Base64 is an encoding, not encryption — anyone can decode it.</Note>
        </>
      )}
    </div>
  )
}
