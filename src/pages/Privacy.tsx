import { useEffect, useState } from 'react'
import { PageHeader } from '../components/ui/PageHeader'
import { Seo } from '../components/ui/Seo'
import { useSite } from '../hooks/useContent'
import { analyticsEnabled, setConsent, storedConsent, type Consent } from '../lib/analytics'
import { PAGE_META } from '../lib/seo'

const UPDATED = '30 September 2026'

function ConsentControls() {
  const [consent, setLocal] = useState<Consent | null>(() => storedConsent())
  useEffect(() => {
    const sync = () => setLocal(storedConsent())
    window.addEventListener('analytics-consent', sync)
    return () => window.removeEventListener('analytics-consent', sync)
  }, [])
  if (!analyticsEnabled()) return <p>Analytics is currently switched off on this site.</p>
  return (
    <div className="not-prose flex flex-wrap items-center gap-3">
      <span className="text-muted text-sm">
        Your choice:{' '}
        <strong className="text-fg">
          {consent === 'granted' ? 'Allowed' : consent === 'denied' ? 'Declined' : 'Not chosen yet'}
        </strong>
      </span>
      <button
        type="button"
        onClick={() => setConsent('granted')}
        className="border-line hover:border-accent/60 rounded-xl border px-4 py-2 text-sm font-semibold"
      >
        Allow analytics
      </button>
      <button
        type="button"
        onClick={() => setConsent('denied')}
        className="border-line hover:border-accent/60 rounded-xl border px-4 py-2 text-sm font-semibold"
      >
        Decline analytics
      </button>
    </div>
  )
}

export default function Privacy() {
  const { data } = useSite()
  const email = data?.contact.email
  return (
    <>
      <Seo {...PAGE_META.privacy} path="/privacy" />
      <PageHeader eyebrow="Privacy" title="Privacy policy" intro={`Last updated ${UPDATED}.`} />
      <div className="md mx-auto max-w-3xl px-4 pb-24 sm:px-6">
        <p>
          Code with Prasad (codewithprasad.in) is a personal website with tutorials, interview
          preparation and developer tools. This page explains what data the site uses and why.
        </p>

        <h2>Developer tools</h2>
        <p>
          Every tool — JSON formatter, JWT decoder, hash generator and the rest — runs entirely in
          your browser. Text, tokens and files you paste or open are processed on your device and
          are <strong>never uploaded, stored or logged</strong> by this site.
        </p>

        <h2>Analytics</h2>
        <p>
          With your consent, the site uses Google Analytics 4 to count visits and see which pages
          and tools are useful — for example page views, approximate country, device type and how
          visitors arrived. Google Analytics does not log or store IP addresses, and advertising
          features are turned off.
        </p>
        <p>
          If you decline, Google Analytics sets no cookies; it may receive anonymous, cookieless
          signals (Consent Mode) that cannot identify you. You can change your choice here at any
          time:
        </p>
        <ConsentControls />
        <p>
          Google processes this data under its own{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer">
            privacy policy
          </a>
          . You can also opt out of Google Analytics on every site with Google&apos;s{' '}
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
          >
            browser add-on
          </a>
          .
        </p>

        <h2>Data stored in your browser</h2>
        <p>
          The site saves a few preferences in your browser&apos;s local storage: your light/dark
          theme, which tutorial lessons and interview questions you have marked as done, and your
          analytics choice. This data stays on your device and you can clear it at any time from
          your browser settings.
        </p>

        <h2>Hosting</h2>
        <p>
          The site is hosted on GitHub Pages. Like any web server, GitHub may process technical data
          such as your IP address to deliver pages and keep the service secure — see GitHub&apos;s
          privacy statement.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy or your data? Email{' '}
          {email ? (
            <a href={`mailto:${email}`}>{email}</a>
          ) : (
            'the site owner via the contact section'
          )}
          .
        </p>
      </div>
    </>
  )
}
