import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'

const listeners = new Set<() => void>()
const read = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light')

export function applyTheme(theme: Theme, remember: boolean) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'dark' ? '#07070d' : '#fafaff')
  if (remember) {
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* storage unavailable (private mode) — the choice just won't persist */
    }
  }
  listeners.forEach((l) => l())
}

export function hasStoredTheme(): boolean {
  try {
    return localStorage.getItem('theme') !== null
  } catch {
    return false
  }
}

export function useTheme() {
  const theme = useSyncExternalStore((l) => {
    listeners.add(l)
    return () => listeners.delete(l)
  }, read)
  const toggle = useCallback(() => applyTheme(read() === 'dark' ? 'light' : 'dark', true), [])
  return { theme, toggle }
}
