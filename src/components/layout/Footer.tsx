import { Link } from 'react-router-dom'
import { useSite } from '../../hooks/useContent'
import { isFilled } from '../../lib/text'
import { socialLabel } from '../../lib/socialIcons'
import { SocialIcon } from '../ui/SocialIcon'
import { Logo } from './Logo'
import { NAV_ITEMS, sectionHref } from './nav'

export function Footer() {
  const { data: site } = useSite()
  const socials = site?.socials.filter((s) => isFilled(s.url)) ?? []
  return (
    <footer className="border-line relative border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="text-muted max-w-sm text-sm">
            {site?.meta.tagline || 'Notes, tutorials and projects from a full stack developer.'}
          </p>
          {socials.length > 0 && (
            <ul className="flex gap-2">
              {socials.map((s) => {
                return (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer me"
                      aria-label={socialLabel(s.platform)}
                      className="border-line text-muted hover:border-accent/60 hover:text-fg grid size-10 place-items-center rounded-xl border transition-all hover:-translate-y-0.5"
                    >
                      <SocialIcon platform={s.platform} />
                    </a>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        <FooterLinks
          title="Explore"
          links={NAV_ITEMS.map((i) => ({
            label: i.label,
            to: 'route' in i ? i.route : sectionHref(i.section),
          }))}
        />
        <FooterLinks
          title="Learn"
          links={[
            { label: 'All tutorials', to: '/tutorials' },
            { label: 'Interview prep', to: '/interview' },
            { label: 'Developer tools', to: '/tools' },
            { label: 'Latest posts', to: '/blog' },
            { label: 'Projects', to: '/projects' },
            { label: 'Privacy', to: '/privacy' },
          ]}
        />
      </div>
      <div className="border-line border-t">
        <p className="text-muted mx-auto max-w-6xl px-4 py-6 text-xs sm:px-6">
          © {new Date().getFullYear()} {site?.profile.name ?? 'Prasad'}. Built with React, Vite
          &amp; Tailwind CSS.
        </p>
      </div>
    </footer>
  )
}

function FooterLinks({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string | object }[]
}) {
  return (
    <div>
      <h2 className="text-muted mb-4 font-mono text-xs tracking-[0.2em] uppercase">{title}</h2>
      <ul className="grid grid-cols-2 gap-2 text-sm md:grid-cols-1">
        {links.map((l) => (
          <li key={l.label}>
            <Link to={l.to} className="text-muted hover:text-fg transition-colors">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
