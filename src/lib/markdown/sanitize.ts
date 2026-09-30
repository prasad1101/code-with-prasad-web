import DOMPurify from 'dompurify'

// External links open in a new tab; make sure they can never reach window.opener.
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A' && node.getAttribute('target') === '_blank') {
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/** Every piece of HTML that reaches the DOM goes through here. */
export const sanitize = (html: string) =>
  DOMPurify.sanitize(html, { ADD_ATTR: ['target'], FORBID_TAGS: ['style', 'form'] })

export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => `&${{ '&': 'amp', '<': 'lt', '>': 'gt', '"': 'quot', "'": '#39' }[c]};`,
  )

/**
 * Route-aware hrefs for a HashRouter site: "/blog/x" → "#/blog/x",
 * "#section" → "<current route>#section", external links open in a new tab.
 */
export function linkAttrs(href: string, anchorBase: string): string {
  if (/^https?:\/\//i.test(href)) {
    return `href="${escapeHtml(href)}" target="_blank"`
  }
  if (href.startsWith('#')) return `href="${escapeHtml(anchorBase + href)}"`
  if (href.startsWith('/')) return `href="#${escapeHtml(href)}"`
  return `href="${escapeHtml(href)}"`
}
