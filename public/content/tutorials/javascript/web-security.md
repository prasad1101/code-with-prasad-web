Security isn't only the back end's job. Front-end code handles untrusted input, stores tokens and runs third-party scripts. These are the vulnerabilities every JavaScript developer must understand — and how to prevent them.

## Cross-site scripting (XSS)

XSS happens when attacker-controlled data is executed as code in your page. Once an attacker's script runs, it can read anything the page can: tokens in `localStorage`, form data, the DOM.

```js
// Vulnerable: a comment containing <img src=x onerror="stealCookies()"> runs code
commentEl.innerHTML = comment.text

// Safe: text is never parsed as HTML
commentEl.textContent = comment.text
```

Defences:

1. **Treat all external data as text.** Use `textContent`, `setAttribute`, and your framework's default escaping (React's `{value}`, Angular's `{{ value }}`).
2. **Avoid HTML sinks**: `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, React's `dangerouslySetInnerHTML`, Angular's `bypassSecurityTrust*`.
3. **When you must render HTML** (e.g. Markdown), sanitise it with a proven library:

```js
import DOMPurify from 'dompurify'
container.innerHTML = DOMPurify.sanitize(userHtml)
```

4. **Never build code from strings**: no `eval`, `new Function`, or `setTimeout('string')`.
5. **Validate URLs** — `javascript:` URLs in `href` execute code:

```js
function safeUrl(url) {
  const parsed = new URL(url, location.origin)
  return ['http:', 'https:', 'mailto:'].includes(parsed.protocol) ? parsed.href : '#'
}
```

## Content Security Policy (CSP)

CSP is a response header that tells the browser which sources of scripts, styles and other resources are allowed. A strict CSP blocks most XSS even if an injection slips through:

```text
Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'
```

Avoid `'unsafe-inline'` and `'unsafe-eval'` for scripts. If you need inline scripts, use nonces or hashes.

## Cross-site request forgery (CSRF)

If your API authenticates with cookies, a malicious site can make the user's browser send a request to your API — with their cookies attached.

Defences:

- Set session cookies with **`SameSite=Lax`** (or `Strict`), plus `Secure` and `HttpOnly`.
- For state-changing requests, require a **CSRF token** the attacker's site can't read, or a custom header (e.g. `X-Requested-With`) that cross-site forms can't send without CORS approval.
- Never change state on `GET` requests.

## Storing tokens

| Where | XSS risk | CSRF risk |
| --- | --- | --- |
| `localStorage` | Any injected script can read it | None (not sent automatically) |
| `HttpOnly` cookie | Scripts can't read it | Needs `SameSite` / CSRF tokens |
| In memory (a variable) | Readable by injected script while the page is open; lost on reload | None |

A common robust setup: a short-lived access token kept in memory, and a refresh token in an `HttpOnly`, `Secure`, `SameSite` cookie.

## CORS is not a security boundary for your server

CORS controls which **browser** origins may read responses. It doesn't stop anyone calling your API with `curl`. Always authenticate and authorise on the server. And never reflect arbitrary `Origin` headers while also allowing credentials.

## Supply-chain risks

Every npm dependency is code running with your privileges.

- Keep dependencies few and maintained; review what you add.
- Commit a lockfile and use `npm ci` in builds.
- Run `npm audit` and enable automated dependency updates.
- Load third-party scripts from trusted sources with **Subresource Integrity**:

```html
<script src="https://cdn.example.com/lib.min.js"
        integrity="sha384-…" crossorigin="anonymous"></script>
```

## Secrets never belong in front-end code

Anything shipped to the browser — bundles, environment variables baked in at build time, source maps — is public. API keys for paid services, database credentials and signing secrets must stay on the server. Front-end "API keys" (e.g. public map keys) should be restricted by domain and quota.

## Other essentials

- **Clickjacking**: prevent your site being framed with `frame-ancestors 'none'` (CSP) or `X-Frame-Options: DENY`.
- **Open redirects**: only redirect to allow-listed URLs after login.
- **Prototype pollution**: validate JSON input and avoid unsafe deep-merge functions (see the prototypes lesson).
- **postMessage**: always check `event.origin` before trusting messages from other windows.

```js
window.addEventListener('message', (event) => {
  if (event.origin !== 'https://trusted.example.com') return
  handle(event.data)
})
```

## Try it yourself

Audit a small app you've built:

1. Search for `innerHTML` and `dangerouslySetInnerHTML` — can any of them receive user data?
2. Check where auth tokens are stored.
3. Add a CSP header in report-only mode (`Content-Security-Policy-Report-Only`) and fix what it reports.
