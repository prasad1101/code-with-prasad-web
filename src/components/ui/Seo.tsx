import { Helmet } from 'react-helmet-async'
import { SITE_URL } from '../../config/site'
import { isFilled } from '../../lib/text'

type Props = {
  title?: string
  description?: string
  /** Route path, e.g. "/blog/my-post". */
  path?: string
  image?: string
  type?: 'website' | 'article'
  publishedAt?: string
}

const SITE_NAME = 'Code with Prasad'
const DEFAULT_DESCRIPTION =
  'Portfolio, blog and step-by-step programming tutorials by Prasad Pawar, a full stack developer (MEAN / MERN) with 8+ years of experience.'

export function Seo({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  publishedAt,
}: Props) {
  const fullTitle = title
    ? `${title} · ${SITE_NAME}`
    : `${SITE_NAME} — Full Stack Developer (MEAN / MERN)`
  const desc = description || DEFAULT_DESCRIPTION
  const url = path === '/' ? SITE_URL : `${SITE_URL}#${path}`
  const img = isFilled(image) ? new URL(image, SITE_URL).href : undefined
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      {img && <meta property="og:image" content={img} />}
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      {img && <meta name="twitter:image" content={img} />}
    </Helmet>
  )
}
