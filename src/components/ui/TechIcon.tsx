import { createElement } from 'react'
import { techIcon } from '../../lib/techIcons'

/** Icon for a technology key or name, e.g. "react", "Node.js". Falls back to a code glyph. */
export function TechIcon({
  icon,
  name,
  className,
}: {
  icon?: string
  name?: string
  className?: string
}) {
  return createElement(techIcon(icon, name), { className, 'aria-hidden': true })
}
