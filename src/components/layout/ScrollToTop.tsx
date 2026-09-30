import { AnimatePresence, m } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FiArrowUp } from 'react-icons/fi'

export function ScrollToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <AnimatePresence>
      {visible && (
        <m.button
          type="button"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={() => window.scrollTo({ top: 0 })}
          aria-label="Scroll to top"
          className="glass border-line text-fg hover:border-accent/60 fixed right-4 bottom-4 z-40 grid size-11 place-items-center rounded-xl border shadow-lg transition-colors sm:right-6 sm:bottom-6"
        >
          <FiArrowUp aria-hidden="true" />
        </m.button>
      )}
    </AnimatePresence>
  )
}
