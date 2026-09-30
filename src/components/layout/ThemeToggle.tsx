import { AnimatePresence, m } from 'framer-motion'
import { FiMoon, FiSun } from 'react-icons/fi'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="border-line text-muted hover:border-accent/60 hover:text-fg relative grid size-10 place-items-center overflow-hidden rounded-xl border transition-colors"
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={theme}
          initial={{ y: -16, opacity: 0, rotate: -60 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 16, opacity: 0, rotate: 60 }}
          transition={{ duration: 0.2 }}
        >
          {theme === 'dark' ? <FiMoon aria-hidden="true" /> : <FiSun aria-hidden="true" />}
        </m.span>
      </AnimatePresence>
    </button>
  )
}
