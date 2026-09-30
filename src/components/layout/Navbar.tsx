import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { Link, useLocation } from 'react-router-dom'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import { Logo } from './Logo'
import { HOME_SECTIONS, NAV_ITEMS, sectionHref, type NavItem } from './nav'
import { ThemeToggle } from './ThemeToggle'

export function Navbar() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const activeSection = useScrollSpy(HOME_SECTIONS, isHome)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile menu on Escape; lock body scroll while it's open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  const isActive = (item: NavItem) =>
    'route' in item ? pathname.startsWith(item.route) : isHome && activeSection === item.section

  const close = () => setOpen(false)

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled || open ? 'glass border-line border-b' : 'border-b border-transparent'
      }`}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6"
      >
        <Logo onClick={close} />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item)
            return (
              <li key={item.label}>
                <Link
                  to={'route' in item ? item.route : sectionHref(item.section)}
                  aria-current={
                    active ? (('route' in item ? 'page' : 'location') as 'page') : undefined
                  }
                  className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'text-fg' : 'text-muted hover:text-fg'
                  }`}
                >
                  {active && (
                    <m.span
                      layoutId="nav-pill"
                      className="bg-surface-2 absolute inset-0 -z-10 rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            className="border-line text-fg grid size-10 place-items-center rounded-xl border lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <FiX aria-hidden="true" /> : <FiMenu aria-hidden="true" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'calc(100dvh - 4rem)' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-y-auto lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 pt-2 pb-8">
              {NAV_ITEMS.map((item, i) => (
                <m.li
                  key={item.label}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.03 * i }}
                >
                  <Link
                    to={'route' in item ? item.route : sectionHref(item.section)}
                    onClick={close}
                    className={`font-display block rounded-xl px-4 py-3 text-2xl font-semibold ${
                      isActive(item) ? 'bg-surface-2 text-fg' : 'text-muted'
                    }`}
                  >
                    {item.label}
                  </Link>
                </m.li>
              ))}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </header>
  )
}
