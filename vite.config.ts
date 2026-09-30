import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { seoPages } from './scripts/seo-pages.ts'
import { BASE_PATH } from './src/config/site.ts'

export default defineConfig({
  base: BASE_PATH,
  // seoPages writes a static HTML file per route, 404.html, sitemap.xml and robots.txt.
  plugins: [react(), tailwindcss(), seoPages()],
})
