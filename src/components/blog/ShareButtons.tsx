import { useState } from 'react'
import { FaLinkedinIn, FaXTwitter } from 'react-icons/fa6'
import { FiCheck, FiLink } from 'react-icons/fi'

export function ShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const u = encodeURIComponent(url)
  const cls =
    'grid size-10 place-items-center rounded-xl border border-line text-muted transition-all hover:-translate-y-0.5 hover:border-accent/60 hover:text-fg'
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted mr-1 text-sm">Share</span>
      <a
        className={cls}
        href={`https://x.com/intent/post?text=${encodeURIComponent(title)}&url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on X"
      >
        <FaXTwitter aria-hidden="true" />
      </a>
      <a
        className={cls}
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Share on LinkedIn"
      >
        <FaLinkedinIn aria-hidden="true" />
      </a>
      <button
        type="button"
        className={cls}
        aria-label={copied ? 'Link copied' : 'Copy link'}
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          } catch {
            /* clipboard blocked — nothing useful to do */
          }
        }}
      >
        {copied ? (
          <FiCheck className="text-emerald-400" aria-hidden="true" />
        ) : (
          <FiLink aria-hidden="true" />
        )}
      </button>
    </div>
  )
}
