import { useEffect, type MouseEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

/**
 * Renders sanitized article HTML, wires up code copy buttons, scrolls to #hash targets and
 * sends internal links (/tutorials/…, /tools/…) through the router instead of a full reload.
 */
export function Article({ html }: { html: string }) {
  const { hash } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!hash) return
    const el = document.getElementById(decodeURIComponent(hash.slice(1)))
    el?.scrollIntoView({ block: 'start' })
  }, [hash, html])

  async function onClick(e: MouseEvent<HTMLDivElement>) {
    const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/"]')
    if (link && !link.target && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault()
      navigate(link.getAttribute('href')!)
      return
    }
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
