import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { analyticsEnabled, setConsent, storedConsent } from '../../lib/analytics'

/** Small, non-blocking analytics consent prompt. Hidden once the visitor chooses. */
export function ConsentBanner() {
  const [open, setOpen] = useState(() => analyticsEnabled() && storedConsent() === null)
  useEffect(() => {
    const sync = () => setOpen(analyticsEnabled() && storedConsent() === null)
    window.addEventListener('analytics-consent', sync)
    return () => window.removeEventListener('analytics-consent', sync)
  }, [])
  if (!open) return null
  const choose = (v: 'granted' | 'denied') => {
    setConsent(v)
    setOpen(false)
  }
  return (
    <div
      role="region"
      aria-label="Analytics consent"
      className="bg-surface border-line fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-2xl border p-4 shadow-2xl sm:bottom-5"
    >
      <p className="text-sm">
        Can we use privacy-friendly Google Analytics cookies to see which pages and tools people
        find useful? No ads, and nothing you type into the tools is ever collected.{' '}
        <Link to="/privacy" className="text-accent underline underline-offset-2">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => choose('granted')}
          className="bg-gradient-accent rounded-xl px-4 py-2 text-sm font-semibold text-white"
        >
          Allow analytics
        </button>
        <button
          type="button"
          onClick={() => choose('denied')}
          className="border-line text-fg hover:border-accent/60 rounded-xl border px-4 py-2 text-sm font-semibold"
        >
          No thanks
        </button>
      </div>
    </div>
  )
}
