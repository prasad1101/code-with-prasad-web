import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import { BASE_PATH } from './src/config/site.ts'

/**
 * GitHub Pages serves 404.html for unknown paths. The app uses HashRouter, so a
 * visit to /code-with-prasad-web/blog/foo is redirected to /code-with-prasad-web/#/blog/foo.
 * Generated here so the base path lives in exactly one place (src/config/site.ts).
 */
function hashRedirect404(): Plugin {
  return {
    name: 'hash-redirect-404',
    apply: 'build',
    generateBundle() {
      const base = JSON.stringify(BASE_PATH)
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Redirecting…</title>
    <meta name="robots" content="noindex" />
    <script>
      (function () {
        var base = ${base};
        var l = window.location;
        var rest = l.pathname.indexOf(base) === 0 ? l.pathname.slice(base.length) : l.pathname.replace(/^\\//, '');
        l.replace(base + '#/' + rest + l.search + l.hash);
      })();
    </script>
  </head>
  <body></body>
</html>
`,
      })
    },
  }
}

export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss(), hashRedirect404()],
})
