import { Suspense, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { usePageViews } from '../../hooks/usePageViews'
import { PageSkeleton } from '../ui/Skeleton'
import { ConsentBanner } from './ConsentBanner'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ScrollToTop } from './ScrollToTop'

export function Layout() {
  const { pathname } = useLocation()
  usePageViews()

  // New page → start at the top. (In-page hashes and ?section= are handled by the pages.)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="bg-surface sr-only z-[100] rounded-lg px-4 py-2 focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>
      <Navbar />
      {/* min-h keeps the footer below the fold while content loads (avoids layout shift). */}
      <main id="main" tabIndex={-1} className="min-h-dvh flex-1 outline-none">
        <Suspense fallback={<PageSkeleton />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <ScrollToTop />
      <ConsentBanner />
    </div>
  )
}
