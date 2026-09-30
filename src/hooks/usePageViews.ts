import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsEnabled, trackPageView } from '../lib/analytics'

/** Sends a GA page_view on every route change (after Helmet has updated the title). */
export function usePageViews() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    if (!analyticsEnabled()) return
    const id = window.setTimeout(() => trackPageView(pathname + search, document.title), 50)
    return () => window.clearTimeout(id)
  }, [pathname, search])
}
