import { Helmet } from 'react-helmet-async'
import {
  absoluteUrl,
  canonicalUrl,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  pageTitle,
  SITE_NAME,
} from '../../lib/seo'
import { isFilled } from '../../lib/text'

type Props = {
  title?: string
  description?: string
  /** Route path, e.g. "/blog/my-post". */
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedAt?: string
  /** Keep the page out of search results (404s, utility pages). */
  noindex?: boolean
}

/*
 * Per-page <head> tags. The build also writes these into each route's static HTML
 * (see vite.config.ts) with the same helpers from lib/seo, so crawlers that don't run
 * JavaScript — including LinkedIn and WhatsApp link previews — see the same values.
 */
export function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  publishedAt,
  noindex,
}: Props) {
  const fullTitle = pageTitle(title)
  const desc = description || DEFAULT_DESCRIPTION
  const url = canonicalUrl(path)
  const img = absoluteUrl(isFilled(image) ? image : DEFAULT_OG_IMAGE)
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {noindex ? <meta name="robots" content="noindex" /> : <link rel="canonical" href={url} />}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}
