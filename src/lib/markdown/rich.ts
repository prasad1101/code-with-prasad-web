import { Marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import plaintext from 'highlight.js/lib/languages/plaintext'
import python from 'highlight.js/lib/languages/python'
import shell from 'highlight.js/lib/languages/shell'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { slugify } from '../text'
import { escapeHtml, linkAttrs, sanitize } from './sanitize'

// Only the languages the content uses — keeps the article chunk small.
const languages = {
  bash,
  css,
  javascript,
  json,
  plaintext,
  python,
  shell,
  sql,
  typescript,
  xml,
  yaml,
}
for (const [name, lang] of Object.entries(languages)) hljs.registerLanguage(name, lang)
hljs.registerAliases(['js', 'jsx', 'mjs'], { languageName: 'javascript' })
hljs.registerAliases(['ts', 'tsx'], { languageName: 'typescript' })
hljs.registerAliases(['html'], { languageName: 'xml' })
hljs.registerAliases(['py'], { languageName: 'python' })
hljs.registerAliases(['sh', 'zsh', 'console'], { languageName: 'bash' })
hljs.registerAliases(['text', 'txt'], { languageName: 'plaintext' })
hljs.registerAliases(['yml'], { languageName: 'yaml' })

export type TocItem = { id: string; text: string; level: number }

const stripTags = (html: string) =>
  html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")

/**
 * Render an article: syntax highlighting, copy buttons, heading ids + anchor links and
 * a table of contents. `anchorBase` is the current route (e.g. "#/blog/my-post") so
 * heading links work under HashRouter.
 */
export function renderArticle(md: string, anchorBase: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = []
  const used = new Map<string, number>()

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens)
        const text = stripTags(inner)
        let id = slugify(text) || 'section'
        const n = used.get(id) ?? 0
        used.set(id, n + 1)
        if (n) id = `${id}-${n}`
        if (depth === 2 || depth === 3) toc.push({ id, text, level: depth })
        const level = Math.min(Math.max(depth, 2), 6)
        return `<h${level} id="${id}">${inner}<a class="heading-anchor" href="${escapeHtml(`${anchorBase}#${id}`)}" aria-label="Link to section: ${escapeHtml(text)}">#</a></h${level}>`
      },
      code({ text, lang }) {
        const language = (lang ?? '').trim().split(/\s+/)[0].toLowerCase()
        const known = language && hljs.getLanguage(language)
        const body = known ? hljs.highlight(text, { language }).value : escapeHtml(text)
        return `<div class="code-block"><div class="code-head"><span>${escapeHtml(language || 'text')}</span><button type="button" class="copy-btn" data-copy aria-label="Copy code to clipboard">Copy</button></div><pre tabindex="0"><code class="hljs">${body}</code></pre></div>`
      },
      link({ href, tokens }) {
        return `<a ${linkAttrs(href, anchorBase)}>${this.parser.parseInline(tokens)}</a>`
      },
      image({ href, text }) {
        return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" decoding="async" />`
      },
    },
  })

  return { html: sanitize(marked.parse(md, { async: false })), toc }
}
