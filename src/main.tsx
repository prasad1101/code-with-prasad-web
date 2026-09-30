import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadSite } from './hooks/useContent'
import { initAnalytics } from './lib/analytics'
import { load } from './lib/resource'
// Self-hosted fonts (bundled, same origin — no render-blocking third-party CSS).
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './index.css'

// Links shared before the move to clean URLs look like /#/tools/jwt-decoder — rewrite
// them to /tools/jwt-decoder before the router reads the location, and again if such a
// link is followed from within the page (a same-document hash change).
function redirectLegacyHash() {
  if (!location.hash.startsWith('#/')) return false
  history.replaceState(null, '', location.hash.slice(1) || '/')
  return true
}
redirectLegacyHash()
window.addEventListener('hashchange', () => {
  // Tell the router the URL changed (it listens for popstate).
  if (redirectLegacyHash()) window.dispatchEvent(new PopStateEvent('popstate'))
})

initAnalytics()

// Start fetching profile data before React renders anything.
load('site', loadSite)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
