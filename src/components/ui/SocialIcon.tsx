import { createElement } from 'react'
import { socialIcon } from '../../lib/socialIcons'

export function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  return createElement(socialIcon(platform), { className, 'aria-hidden': true })
}
