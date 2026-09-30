Angular has strong built-in protections — but they can be bypassed, and the front end is only one layer of security. This lesson covers how Angular protects you, where developers accidentally opt out, and how to secure authentication and communication in enterprise apps.

## Built-in XSS protection

Angular treats **all values as untrusted** by default. Interpolation and property bindings are escaped or sanitised automatically:

```html
<p>{{ comment.text }}</p>              <!-- rendered as text, <script> is harmless -->
<div [innerHTML]="comment.html"></div> <!-- sanitised: scripts and event handlers removed -->
<a [href]="profile.website">Site</a>  <!-- javascript: URLs are blocked -->
```

When Angular strips something, it logs a warning ("sanitizing HTML stripped some content") in development.

## Where developers bypass protection

### `bypassSecurityTrust*`

```ts
// ✗ Dangerous if `html` contains user input
this.safe = this.sanitizer.bypassSecurityTrustHtml(html)
```

`bypassSecurityTrustHtml`, `…Url`, `…ResourceUrl`, `…Script` and `…Style` disable sanitisation for that value. Only use them on content that is fully trusted (e.g. static strings, or HTML sanitised by a well-configured library such as DOMPurify on content your team controls). Search the codebase for `bypassSecurityTrust` during security reviews.

### Direct DOM access

```ts
this.el.nativeElement.innerHTML = userHtml   // ✗ bypasses Angular entirely
```

Avoid manipulating the DOM with `nativeElement`; use bindings or `Renderer2`, never with unsanitised HTML.

### Template injection

Never build Angular templates from user input at runtime. Angular's AOT compilation compiles templates at build time, which removes this risk class for normal code — keep it that way.

## Content Security Policy and Trusted Types

A strict **CSP** stops injected scripts from running even if an XSS bug slips through. Angular supports:

- **Nonce-based CSP** — Angular can add a nonce to its inline styles via the `ngCspNonce` attribute or the `CSP_NONCE` token; the server generates a fresh nonce per response.
- **Trusted Types** — a browser feature that forces DOM sinks like `innerHTML` to accept only vetted values. Angular is compatible with Trusted Types; enable them with the header `Content-Security-Policy: trusted-types angular; require-trusted-types-for 'script';` (plus policies for any libraries that need them).

## Authentication in single-page apps

- Prefer **OAuth 2.0 / OpenID Connect with Authorization Code + PKCE** for SSO providers (Azure AD, Okta, Keycloak, Cognito) using a maintained library.
- Keep **access tokens short-lived**. Store them in memory rather than `localStorage` where possible; a refresh token belongs in an `HttpOnly`, `Secure`, `SameSite` cookie — or use a **Backend-for-Frontend (BFF)** that keeps tokens server-side entirely and gives the browser only a session cookie.
- Attach tokens with an **interceptor**, and only for your own API origins:

```ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).accessToken()
  const isApi = req.url.startsWith(inject(API_BASE_URL))
  return token && isApi ? next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })) : next(req)
}
```

- Route **guards are UX, not security**. Anything hidden in the UI must also be enforced by the API.

## CSRF

If your API uses cookie-based authentication, protect state-changing requests from cross-site request forgery. `HttpClient` supports the double-submit cookie pattern: when the server sets an `XSRF-TOKEN` cookie, Angular automatically copies it into an `X-XSRF-TOKEN` header on mutating requests to the same origin (configurable with `withXsrfConfiguration`). The server must verify the header. `SameSite` cookies add another layer.

## Secure communication and configuration

- HTTPS everywhere; HSTS on the server.
- Never put secrets (API keys with privileges, client secrets) in the Angular bundle — everything in `environment.ts` is public.
- Restrict CORS on the API to known origins.
- Validate data from APIs you don't control before trusting it.

## Dependency and build security

- `npm audit` / automated dependency updates; remove unused packages.
- Pin versions with a lockfile and use `npm ci` in CI.
- Keep Angular up to date with `ng update` — security fixes land in supported versions.
- Use Subresource Integrity for any third-party scripts loaded from CDNs.

## Other front-end risks

- **Open redirects** — validate `returnUrl` parameters (only allow relative in-app paths) before navigating after login.
- **Sensitive data in the browser** — don't cache personal data in `localStorage`; clear state on logout.
- **Clickjacking** — the server should send `frame-ancestors 'none'` (CSP) or `X-Frame-Options: DENY`.
- **Error messages** — show friendly messages; don't render raw server errors or stack traces.

## Security review checklist

- [ ] No `bypassSecurityTrust*` on user-controlled data
- [ ] No `innerHTML` / `nativeElement` writes with untrusted content
- [ ] Strict CSP (with nonces) and, ideally, Trusted Types
- [ ] Tokens short-lived, not in `localStorage`; BFF or OIDC + PKCE
- [ ] Interceptor adds tokens only to first-party API URLs
- [ ] CSRF protection for cookie-authenticated APIs
- [ ] `returnUrl` validated; no secrets in the bundle
- [ ] Dependencies audited and Angular kept current

## Try it yourself

Audit an Angular project: search for `bypassSecurityTrust`, `innerHTML` and `nativeElement`; check where tokens are stored; add a CSP header in report-only mode and fix the violations; and validate the `returnUrl` used after login.
