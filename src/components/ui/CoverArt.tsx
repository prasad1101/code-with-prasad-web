import { isFilled } from '../../lib/text'
import { TechIcon } from './TechIcon'

/**
 * Cover image, or — when none is set — a generated gradient tile with a tech icon, so
 * cards without artwork still look intentional.
 */
export function CoverArt({
  image,
  alt,
  seed,
  icon,
  className = '',
  eager,
}: {
  image?: string
  alt: string
  seed: string
  icon?: string
  className?: string
  eager?: boolean
}) {
  if (isFilled(image)) {
    return (
      <img
        src={image}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        className={`h-full w-full object-cover ${className}`}
      />
    )
  }
  const hue = [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <div
      role="img"
      aria-label={alt}
      className={`relative grid h-full w-full place-items-center overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(circle at 20% 20%, hsl(${hue} 80% 60% / 0.55), transparent 55%),
          radial-gradient(circle at 85% 80%, hsl(${(hue + 70) % 360} 85% 55% / 0.5), transparent 55%),
          var(--c-surface-2)`,
      }}
    >
      <div className="grid-bg absolute inset-0 opacity-60" />
      <TechIcon icon={icon} className="relative size-14 text-white/90 drop-shadow-lg" />
    </div>
  )
}
