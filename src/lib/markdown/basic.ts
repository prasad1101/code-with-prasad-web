import { Marked } from 'marked'
import { linkAttrs, sanitize } from './sanitize'

const marked = new Marked({
  gfm: true,
  renderer: {
    link({ href, tokens }) {
      return `<a ${linkAttrs(href, '')}>${this.parser.parseInline(tokens)}</a>`
    },
  },
})

/** Lightweight markdown → safe HTML (no syntax highlighting), for short bios and blurbs. */
export const renderBasicMarkdown = (md: string) => sanitize(marked.parse(md, { async: false }))
