import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { loadSite } from './hooks/useContent'
import { load } from './lib/resource'
// Self-hosted fonts (bundled, same origin — no render-blocking third-party CSS).
import '@fontsource-variable/inter/wght.css'
import '@fontsource-variable/space-grotesk/wght.css'
import '@fontsource-variable/jetbrains-mono/wght.css'
import './index.css'

// Start fetching profile data before React renders anything.
load('site', loadSite)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
