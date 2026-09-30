/**
 * Path the site is served from: '/' on the custom domain. (A GitHub Pages project site
 * without a domain would be '/<repo-name>/'.)
 */
export const BASE_PATH = '/'

/** Origin of the deployed site, used for canonical, Open Graph, sitemap and share links. */
export const SITE_ORIGIN = 'https://codewithprasad.in'

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`

/**
 * Google Analytics 4 measurement ID, e.g. 'G-AB12CD34EF' (Google Analytics → Admin →
 * Data streams → your web stream). Leave empty to turn analytics off completely.
 */
export const GA_MEASUREMENT_ID = 'G-S8ZV4J78QX'

/**
 * Google Search Console HTML-tag verification token (the `content` value of the
 * google-site-verification meta tag). Optional — DNS verification in Hostinger works too.
 */
export const GOOGLE_SITE_VERIFICATION = ''
