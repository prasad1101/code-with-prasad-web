import { GA_MEASUREMENT_ID } from '../config/site'

/*
 * Google Analytics 4 with Consent Mode v2. Nothing loads unless GA_MEASUREMENT_ID is set,
 * the site is the production build, and it isn't running on localhost.
 *
 * Until a visitor accepts, analytics storage is "denied": GA sets no cookies and only
 * receives anonymous, cookieless pings. Accepting (or declining) is remembered in
 * localStorage and can be changed any time from the privacy page.
 */

type Gtag = (...args: unknown[]) => void
declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export type Consent = 'granted' | 'denied'
const CONSENT_KEY = 'analytics-consent'

export const analyticsEnabled = () =>
  !!GA_MEASUREMENT_ID &&
  import.meta.env.PROD &&
  typeof window !== 'undefined' &&
  !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)

export function storedConsent(): Consent | null {
  try {
    const v = localStorage.getItem(CONSENT_KEY)
    return v === 'granted' || v === 'denied' ? v : null
  } catch {
    return null
  }
}

let started = false

export function initAnalytics() {
  if (started || !analyticsEnabled()) return
  started = true
  window.dataLayer = window.dataLayer || []
  // gtag must push the `arguments` object itself, not an array copy.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  const consent = storedConsent() ?? 'denied'
  window.gtag('consent', 'default', {
    analytics_storage: consent,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  // Page views are sent manually on every route change (see trackPageView).
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(s)
}

export function setConsent(value: Consent) {
  try {
    localStorage.setItem(CONSENT_KEY, value)
  } catch {
    /* storage blocked — the choice lasts for this visit only */
  }
  window.gtag?.('consent', 'update', { analytics_storage: value })
  window.dispatchEvent(new Event('analytics-consent'))
}

export function trackPageView(path: string, title: string) {
  window.gtag?.('event', 'page_view', {
    page_path: path,
    page_location: window.location.origin + path,
    page_title: title,
  })
}

/** Custom event, e.g. trackEvent('tool_used', { tool: 'jwt-decoder' }). */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  window.gtag?.('event', name, params)
}
