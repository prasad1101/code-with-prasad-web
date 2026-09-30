/**
 * Path the site is served from. GitHub Pages project sites live under /<repo-name>/.
 * Switching to a custom domain (e.g. codewithprasad.dev)? Set BASE_PATH to '/' and
 * SITE_ORIGIN to the new origin — nothing else needs to change.
 */
export const BASE_PATH = '/code-with-prasad-web/'

/** Origin of the deployed site, used for canonical, Open Graph and share links. */
export const SITE_ORIGIN = 'https://prasad1101.github.io'

export const SITE_URL = `${SITE_ORIGIN}${BASE_PATH}`
