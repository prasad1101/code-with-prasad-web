import { FiArrowRight, FiBookOpen, FiDownload } from 'react-icons/fi'
import type { Site } from '../../lib/schemas'
import { isFilled } from '../../lib/text'
import { sectionHref } from '../layout/nav'
import { Button } from '../ui/Button'
import { Typing } from './Typing'

export function Hero({ site }: { site: Site }) {
  const { profile } = site
  const firstName = profile.name.split(' ')[0]
  const years = profile.yearsOfExperience
  return (
    <section id="home" className="relative isolate overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      <HeroBackground />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.15fr_1fr]">
        <div>
          <div
            className="rise mb-6 flex flex-wrap items-center gap-2"
            style={{ animationDelay: '0s' }}
          >
            {years > 0 && (
              <span className="border-accent/40 bg-accent/10 text-fg rounded-full border px-3 py-1 font-mono text-xs">
                {years}+ years shipping software
              </span>
            )}
            {profile.availableForWork && (
              <span className="border-line bg-surface/60 text-muted inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Open to opportunities
              </span>
            )}
          </div>

          <h1
            className="rise text-5xl leading-[1.02] font-bold sm:text-6xl lg:text-7xl"
            style={{ animationDelay: '0.08s' }}
          >
            Hi, I&apos;m <span className="text-gradient">{firstName}</span>
            <span className="text-accent-2">.</span>
          </h1>

          <p
            className="rise text-muted mt-5 text-xl sm:text-2xl"
            style={{ animationDelay: '0.16s' }}
          >
            {profile.role}
          </p>

          {profile.typingPhrases.length > 0 && (
            <p
              className="rise mt-6 font-mono text-base sm:text-lg"
              style={{ animationDelay: '0.24s' }}
            >
              <span className="text-muted">I build with </span>
              <Typing phrases={profile.typingPhrases} />
            </p>
          )}

          <div className="rise mt-10 flex flex-wrap gap-3" style={{ animationDelay: '0.32s' }}>
            <Button to={sectionHref('work')}>
              View work{' '}
              <FiArrowRight
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Button>
            <Button to="/blog" variant="secondary">
              <FiBookOpen aria-hidden="true" /> Read blog
            </Button>
            {isFilled(profile.resumeUrl) && (
              <Button href={profile.resumeUrl} variant="secondary" download>
                <FiDownload aria-hidden="true" /> Resume
              </Button>
            )}
          </div>
        </div>

        <div className="rise hidden lg:block" style={{ animationDelay: '0.25s' }}>
          <CodeCard site={site} />
        </div>
      </div>
    </section>
  )
}

function HeroBackground() {
  return (
    <div aria-hidden="true" className="absolute inset-0 -z-10">
      <div className="grid-bg absolute inset-0" />
      <div className="blob top-[-10%] left-[-8%] size-[28rem] bg-violet-600/40" />
      <div
        className="blob top-[20%] right-[-10%] size-[26rem] bg-cyan-500/30"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="blob bottom-[-20%] left-[30%] size-[22rem] bg-indigo-500/25"
        style={{ animationDelay: '-12s' }}
      />
      <div className="to-bg absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent" />
    </div>
  )
}

/** Faux editor window describing the developer, generated from site data. */
function CodeCard({ site }: { site: Site }) {
  const { profile } = site
  const stack = profile.typingPhrases.slice(0, 4)
  const k = (s: string) => <span className="hljs-keyword">{s}</span>
  const p = (s: string) => <span className="hljs-attr">{s}</span>
  const str = (s: string) => <span className="hljs-string">&apos;{s}&apos;</span>
  return (
    <div className="card relative overflow-hidden shadow-[0_30px_80px_-30px_var(--c-glow)]">
      <div className="border-line flex items-center gap-2 border-b px-4 py-3">
        <span className="size-3 rounded-full bg-red-400/80" />
        <span className="size-3 rounded-full bg-yellow-400/80" />
        <span className="size-3 rounded-full bg-green-400/80" />
        <span className="text-muted ml-3 font-mono text-xs">developer.ts</span>
      </div>
      <pre className="overflow-x-auto p-6 font-mono text-[0.84rem] leading-7">
        <code className="hljs">
          {k('const')} <span className="hljs-title">developer</span> = {'{'}
          {'\n  '}
          {p('name')}: {str(profile.name)},{'\n  '}
          {p('role')}: {str(profile.role.replace(/\s*\(.*\)/, ''))},{'\n  '}
          {profile.yearsOfExperience > 0 && (
            <>
              {p('experience')}: {str(`${profile.yearsOfExperience}+ years`)},{'\n  '}
            </>
          )}
          {p('stack')}: [
          {stack.map((s, i) => (
            <span key={s}>
              {str(s)}
              {i < stack.length - 1 ? ', ' : ''}
            </span>
          ))}
          ],{'\n  '}
          {p('writes')}: [{str('blog posts')}, {str('tutorials')}],{'\n  '}
          {p('available')}: <span className="hljs-literal">{String(profile.availableForWork)}</span>
          ,{'\n'}
          {'}'}
        </code>
      </pre>
    </div>
  )
}
