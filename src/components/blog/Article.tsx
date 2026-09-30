import { useEffect, type MouseEvent } from 'react'
import { useLocation } from 'react-router-dom'

/** Renders sanitized article HTML, wires up code copy buttons and scrolls to #hash targets. */
export function Article({ html }: { html: string }) {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    el?.scrollIntoView({ block: 'start' })
  }, [hash, html])

  async function onClick(e: MouseEvent<HTMLDivElement>) {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-copy]')
    if (!btn) return
    const code = btn.closest('.code-block')?.querySelector('code')?.textContent ?? ''
    try {
      await navigator.clipboard.writeText(code)
      btn.textContent = 'Copied!'
      btn.dataset.copied = 'true'
    } catch {
      btn.textContent = 'Press ⌘/Ctrl+C'
    }
    setTimeout(() => {
      btn.textContent = 'Copy'
      delete btn.dataset.copied
    }, 1800)
  }

  return <div className="md" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />
}
