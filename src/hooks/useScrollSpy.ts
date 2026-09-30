import { useEffect, useState } from 'react'

/** Returns the id of the section currently in the middle band of the viewport. */
export function useScrollSpy(ids: string[], enabled = true, rootMargin = '-40% 0px -55% 0px') {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    if (!enabled) return
    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null)
    if (!elements.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting)
        if (visible.length) setActive(visible[0].target.id)
      },
      { rootMargin },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [key, enabled, rootMargin])

  return enabled ? active : null
}
