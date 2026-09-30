import { useMemo } from 'react'
import { FiBriefcase, FiMapPin } from 'react-icons/fi'
import { renderBasicMarkdown } from '../../lib/markdown/basic'
import type { Site } from '../../lib/schemas'
import { isFilled } from '../../lib/text'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import { socialLabel } from '../../lib/socialIcons'
import { SocialIcon } from '../ui/SocialIcon'

export function About({ site }: { site: Site }) {
  const { profile, socials, education, certifications } = site
  const html = useMemo(() => renderBasicMarkdown(profile.summary), [profile.summary])
  const initials = profile.name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  const links = socials.filter((s) => isFilled(s.url))

  return (
    <Section id="about" eyebrow="About" title="A little about me">
      <div className="grid gap-12 lg:grid-cols-[320px_1fr]">
        <Reveal>
          <div className="card relative mx-auto max-w-xs p-3 lg:mx-0">
            <div className="bg-gradient-accent absolute -inset-px -z-10 rounded-2xl opacity-40 blur-xl" />
            {isFilled(profile.avatarUrl) ? (
              <img
                src={profile.avatarUrl}
                alt={`Portrait of ${profile.name}`}
                loading="lazy"
                decoding="async"
                width={320}
                height={320}
                className="aspect-square w-full rounded-xl object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label={`${profile.name} monogram`}
                className="bg-gradient-accent font-display grid aspect-square w-full place-items-center rounded-xl text-7xl font-bold text-white"
              >
                {initials}
              </div>
            )}
            <ul className="text-muted mt-4 space-y-2 px-2 pb-2 text-sm">
              {isFilled(profile.location) && (
                <li className="flex items-center gap-2">
                  <FiMapPin className="text-accent-2" aria-hidden="true" /> {profile.location}
                </li>
              )}
              {profile.yearsOfExperience > 0 && (
                <li className="flex items-center gap-2">
                  <FiBriefcase className="text-accent-2" aria-hidden="true" />
                  {profile.yearsOfExperience}+ years of professional experience
                </li>
              )}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="md max-w-none text-lg" dangerouslySetInnerHTML={{ __html: html }} />
          {links.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-3">
              {links.map((s) => {
                return (
                  <a
                    key={s.url}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="border-line text-muted hover:border-accent/60 hover:text-fg inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:-translate-y-0.5"
                  >
                    <SocialIcon platform={s.platform} /> {socialLabel(s.platform)}
                  </a>
                )
              })}
            </div>
          )}

          {(education.length > 0 || certifications.length > 0) && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2">
              {education.length > 0 && (
                <div>
                  <h3 className="text-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">
                    Education
                  </h3>
                  <ul className="space-y-3">
                    {education.map((e) => (
                      <li key={e.school + e.degree} className="card p-4">
                        <p className="font-semibold">{e.school}</p>
                        <p className="text-muted text-sm">
                          {[e.degree, e.field].filter(isFilled).join(', ')}
                          {(e.start || e.end) &&
                            ` · ${[e.start, e.end].filter(Boolean).join(' – ')}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {certifications.length > 0 && (
                <div>
                  <h3 className="text-muted mb-3 font-mono text-xs tracking-[0.2em] uppercase">
                    Certifications
                  </h3>
                  <ul className="space-y-3">
                    {certifications.map((c) => (
                      <li key={c.name} className="card p-4">
                        {isFilled(c.url) ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent font-semibold"
                          >
                            {c.name}
                          </a>
                        ) : (
                          <p className="font-semibold">{c.name}</p>
                        )}
                        <p className="text-muted text-sm">
                          {[c.issuer, c.year].filter(Boolean).join(' · ')}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Reveal>
      </div>
    </Section>
  )
}
