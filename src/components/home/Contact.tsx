import { useState, type FormEvent } from 'react'
import { FiCheckCircle, FiMail, FiSend } from 'react-icons/fi'
import type { Site } from '../../lib/schemas'
import { isEmail, isFilled } from '../../lib/text'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Section } from '../ui/Section'
import { socialLabel } from '../../lib/socialIcons'
import { SocialIcon } from '../ui/SocialIcon'

type Status = 'idle' | 'sending' | 'sent' | 'error'

export function Contact({ site }: { site: Site }) {
  const { email, formEndpoint } = site.contact
  const hasEmail = isEmail(email)
  const hasForm = isFilled(formEndpoint) && /^https:\/\//.test(formEndpoint)
  const linkedin = site.socials.find(
    (s) => s.platform.toLowerCase() === 'linkedin' && isFilled(s.url),
  )

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title={
        <>
          Let&apos;s build something <span className="text-gradient">great</span>
        </>
      }
      intro="Hiring, freelance work or just a question about a post — my inbox is open."
    >
      <div className={`grid gap-8 ${hasForm ? 'lg:grid-cols-[1fr_1.3fr]' : ''}`}>
        <Reveal>
          <div className="card flex h-full flex-col justify-center gap-4 p-8">
            {hasEmail && (
              <a
                href={`mailto:${email}`}
                className="group inline-flex items-center gap-3 text-lg font-semibold break-all"
              >
                <span className="bg-accent/15 text-accent grid size-11 shrink-0 place-items-center rounded-xl">
                  <FiMail aria-hidden="true" />
                </span>
                <span className="group-hover:text-accent">{email}</span>
              </a>
            )}
            {linkedin && (
              <a
                href={linkedin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 text-lg font-semibold"
              >
                <span className="bg-accent-2/15 text-accent-2 grid size-11 shrink-0 place-items-center rounded-xl">
                  <SocialIcon platform="linkedin" />
                </span>
                <span className="group-hover:text-accent">
                  Message me on {socialLabel('linkedin')}
                </span>
              </a>
            )}
            {site.profile.availableForWork && (
              <p className="text-muted text-sm">Currently open to full-time and contract roles.</p>
            )}
          </div>
        </Reveal>
        {hasForm && (
          <Reveal delay={0.08}>
            <ContactForm endpoint={formEndpoint} />
          </Reveal>
        )}
      </div>
    </Section>
  )
}

function ContactForm({ endpoint }: { endpoint: string }) {
  const [status, setStatus] = useState<Status>('idle')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setStatus('sending')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div
        role="status"
        className="card flex h-full flex-col items-center justify-center gap-3 p-8 text-center"
      >
        <FiCheckCircle className="size-10 text-emerald-400" aria-hidden="true" />
        <p className="font-display text-xl font-semibold">Thanks — message sent!</p>
        <p className="text-muted text-sm">I&apos;ll get back to you soon.</p>
      </div>
    )
  }

  const field =
    'w-full rounded-xl border border-line bg-surface-2/60 px-4 py-3 text-sm text-fg placeholder:text-muted/70 transition-colors focus:border-accent focus:outline-none'
  return (
    <form onSubmit={submit} className="card grid gap-4 p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium">
          Name
          <input
            name="name"
            required
            autoComplete="name"
            className={field}
            placeholder="Your name"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
            placeholder="you@company.com"
          />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-medium">
        Message
        <textarea
          name="message"
          required
          rows={5}
          className={field}
          placeholder="What would you like to talk about?"
        />
      </label>
      {/* Honeypot for bots (Formspree ignores submissions that fill it). */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" disabled={status === 'sending'}>
          <FiSend aria-hidden="true" /> {status === 'sending' ? 'Sending…' : 'Send message'}
        </Button>
        {status === 'error' && (
          <p role="alert" className="text-sm text-red-400">
            Couldn&apos;t send right now — please try again or use email.
          </p>
        )}
      </div>
    </form>
  )
}
